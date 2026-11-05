import { strict as assert } from "node:assert";
import { parsePublicationFeed, parseUnConsolidated } from "./xml-feeds.ts";

Deno.test("UN consolidated XML: people, entities, aliases and identifiers", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CONSOLIDATED_LIST>
  <INDIVIDUALS>
    <INDIVIDUAL>
      <INDIVIDUAL_ID>007</INDIVIDUAL_ID><FIRST_NAME>Jane</FIRST_NAME><SECOND_NAME>Doe</SECOND_NAME>
      <REFERENCE_NUMBER>QDi.007</REFERENCE_NUMBER><UN_LIST_TYPE>Al-Qaida</UN_LIST_TYPE>
      <INDIVIDUAL_ALIAS><ALIAS_NAME>J. Doe</ALIAS_NAME></INDIVIDUAL_ALIAS>
      <INDIVIDUAL_ALIAS><ALIAS_NAME>Janet</ALIAS_NAME></INDIVIDUAL_ALIAS>
      <NATIONALITY><VALUE>Exampleland</VALUE></NATIONALITY>
      <INDIVIDUAL_DATE_OF_BIRTH><DATE>1970-01-01</DATE></INDIVIDUAL_DATE_OF_BIRTH>
    </INDIVIDUAL>
  </INDIVIDUALS>
  <ENTITIES>
    <ENTITY>
      <ENTITY_ID>008</ENTITY_ID><ENTITY_NAME>Example &amp; Company</ENTITY_NAME>
      <ENTITY_ALIAS><ALIAS_NAME>Example Ltd</ALIAS_NAME></ENTITY_ALIAS>
    </ENTITY>
  </ENTITIES>
</CONSOLIDATED_LIST>`;
  const rows = parseUnConsolidated({ code: "un_consolidated", source_url: "https://example.org/un.xml" }, xml);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].source_entry_id, "007");
  assert.equal(rows[0].subject_name, "Jane Doe");
  assert.deepEqual(rows[0].aliases, ["J. Doe", "Janet"]);
  assert.deepEqual(rows[0].identifying_data.nationality, ["Exampleland"]);
  assert.equal(rows[1].subject_name, "Example & Company");
  assert.deepEqual(rows[1].aliases, ["Example Ltd"]);
});
Deno.test("RSS with escaped content parses without double-decoding", () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
    <item><title>New &amp; updated notice</title>
    <link>https://example.org/rss/1</link><pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate>
    <description>Designation &amp; removal</description></item>
  </channel></rss>`;
  const items = parsePublicationFeed(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "New & updated notice");
  assert.equal(items[0].description, "Designation & removal");
  assert.equal(items[0].url, "https://example.org/rss/1");
});
Deno.test("Atom selects alternate link", () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
    <entry><title>Update</title><link rel="self" href="https://example.org/api/update"/>
    <link rel="alternate" href="https://example.org/update"/>
    <updated>2026-11-05T09:00:00Z</updated><summary>New notice</summary></entry>
  </feed>`;
  const items = parsePublicationFeed(xml);
  assert.equal(items[0].url, "https://example.org/update");
  assert.equal(items[0].date, "2026-11-05T09:00:00Z");
});
Deno.test("Reject malformed XML, DTDs, and unexpected feeds", () => {
  assert.throws(() => parsePublicationFeed("<rss><channel></rss>"), /Malformed XML/);
  assert.throws(() => parsePublicationFeed('<!DOCTYPE rss [ <!ENTITY x "bad"> ]><rss></rss>'), /not allowed/);
  assert.throws(() => parsePublicationFeed("<response/>"), /Unsupported RSS\/Atom/);
  assert.throws(() => parseUnConsolidated({ code:"un_consolidated",source_url:"https://example.org" }, "<rss/>"), /Unexpected UN XML root/);
});
