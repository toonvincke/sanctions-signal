import test from "node:test";
import assert from "node:assert/strict";
import { csvRows, parseSanctionsCsv, validateSnapshot } from "./sanctions-parsers.ts";

const ofac = { code: "ofac_sdn", source_url: "https://example.org/sdn.csv" };
const uk = { code: "uk_sanctions", source_url: "https://example.org/uk.csv" };

test("CSV parser handles embedded delimiters, line breaks and escaped quotes", () => {
  const rows = csvRows('1,"A, B","multiline\nvalue","a""b"\r\n2,C,D,E');
  assert.deepEqual(rows, [["1", "A, B", "multiline\nvalue", 'a"b'], ["2", "C", "D", "E"]]);
  assert.throws(() => csvRows('1,"unfinished'), /unterminated/);
});
test("OFAC SDN identifiers are stable and numeric", () => {
  const data = '1234,"DOE, JOHN",individual,"[RUSSIA-EO14024]",-0-\n5678,EXAMPLE CO,entity,IRAN,-0-';
  const result = parseSanctionsCsv(ofac, data);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((r) => r.source_entry_id), ["1234", "5678"]);
  assert.equal(result[0].subject_name, "DOE, JOHN");
  assert.throws(() => parseSanctionsCsv(ofac, 'hello,name,entity,TEST'), /Malformed OFAC/);
});
test("UKSL groups aliases under a single Unique ID, preferring the primary name", () => {
  const header = "Unique ID,Name 1,Name 2,Name 3,Name 4,Name 5,Name 6,Name type,Regime Name,Individual Entity Ship,OFSI Group ID";
  const data = ['Report Date,04/11/2026', header,
    'RUS1,,,,,,Alias Corp,Alias,Russia,Entity,123',
    'RUS1,,,,,,Example Corporation,Primary Name,Russia,Entity,123',
    'RUS1,,,,,,Example Co,Primary Name Variation,Russia,Entity,123',
    'RUS2,Jane,,,,,Smith,Primary Name,Iran,Individual,456'].join("\n");
  const result = parseSanctionsCsv(uk, data);
  assert.equal(result.length, 2);
  assert.equal(result[0].subject_name, "Example Corporation");
  assert.deepEqual(result[0].aliases, ["Alias Corp", "Example Co"]);
  assert.equal(result[0].identifying_data.ofsi_group_id, "123");
  assert.equal(result[1].subject_name, "Jane Smith");
  validateSnapshot(result, 2);
});
test("UKSL must contain documented headers and stable IDs", () => {
  assert.throws(() => parseSanctionsCsv(uk, "junk,row\nfoo,bar"), /required headers/);
  const data = "Unique ID,Name 6,Name type\n,Example,Primary Name";
  assert.throws(() => parseSanctionsCsv(uk, data), /Malformed UKSL/);
});
test("snapshot rejects duplicates, empty names and unexpectedly small imports", () => {
  const entries = parseSanctionsCsv(ofac, '1,Person,individual,RUSSIA\n1,Person 2,individual,RUSSIA');
  assert.throws(() => validateSnapshot(entries, 1), /Duplicate identifiers/);
  assert.throws(() => validateSnapshot([entries[0]], 10), /small/);
});
