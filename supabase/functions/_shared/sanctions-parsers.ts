export type SanctionsSource = {
  code: string;
  source_url: string;
};
export type SanctionsEntry = {
  source_code: string;
  source_entry_id: string;
  subject_name: string;
  subject_type: string | null;
  programs: string[];
  aliases: string[];
  identifying_data: Record<string, unknown>;
  source_url: string;
  content_hash: string;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const uniqueSorted = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort();

export function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field); field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (quoted) throw new Error("Malformed CSV: unterminated quoted field");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function ofacCsv(source: SanctionsSource, input: string): SanctionsEntry[] {
  const rows = csvRows(input.replace(/^\uFEFF/, ""));
  const data = rows[0] && normalize(rows[0][0] ?? "") === "entnum" ? rows.slice(1) : rows;
  // OFAC CSV exports can end with a standalone -0- sentinel, not a designation.
  // Only ignore this exact terminal marker; malformed records elsewhere still fail.
  if (data.length && data[data.length - 1].length === 1 && data[data.length - 1][0].trim() === "-0-") {
    data.pop();
  }
  if (!data.length) throw new Error("OFAC CSV is empty");
  return data.map((row, index) => {
    // SDN.CSV and CONS_PRIM.CSV: ent_num, name, sdn_type, program, ...
    const id = (row[0] ?? "").trim();
    const name = (row[1] ?? "").trim();
    if (!/^\d+$/.test(id) || !name) {
      throw new Error(`Malformed OFAC row ${index + 1}: missing numeric ent_num or name`);
    }
    const program = (row[3] ?? "").trim();
    const raw = Object.fromEntries(row.map((value, i) => [String(i), value]));
    return {
      source_code: source.code, source_entry_id: id, subject_name: name,
      subject_type: (row[2] ?? "").trim() || null,
      programs: program && program !== "-0-" ? uniqueSorted(program.split(/\s*;\s*|\s*\|\s*/)) : [],
      aliases: [], identifying_data: raw, source_url: source.source_url, content_hash: "",
    };
  });
}

function ukCsv(source: SanctionsSource, input: string): SanctionsEntry[] {
  const rows = csvRows(input.replace(/^\uFEFF/, ""));
  // UKSL CSV begins with a report date, followed by the real header row.
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map(normalize);
    return normalized.includes("uniqueid") && normalized.includes("name6") && normalized.includes("nametype");
  });
  if (headerIndex < 0) throw new Error("UKSL CSV is missing required headers (Unique ID, Name 6, Name type)");
  const headers = rows[headerIndex].map(normalize);
  const column = (row: string[], name: string): string => (row[headers.indexOf(normalize(name))] ?? "").trim();
  const groups = new Map<string, {
    primary: string; primaryKind: number; aliases: string[]; programs: string[];
    subjectType: string | null; primaryDetails: Record<string, string>;
  }>();
  for (const [offset, row] of rows.slice(headerIndex + 1).entries()) {
    const id = column(row, "Unique ID");
    const parts = ["Name 1", "Name 2", "Name 3", "Name 4", "Name 5", "Name 6"]
      .map((name) => column(row, name)).filter(Boolean);
    const name = parts.join(" ");
    if (!id || !name) throw new Error(`Malformed UKSL CSV row ${headerIndex + offset + 2}`);
    const nameType = normalize(column(row, "Name type"));
    const kind = nameType === "primaryname" ? 3 : nameType === "primarynamevariation" ? 2 : nameType === "alias" ? 0 : 1;
    const regime = column(row, "Regime Name");
    const type = column(row, "Individual, Entity, Ship") || column(row, "Designation Type");
    const details = {
      "unique_id": id, "ofsi_group_id": column(row, "OFSI Group ID"),
      "un_reference_number": column(row, "UN Reference Number"),
      "sanctions_imposed": column(row, "Sanctions Imposed"),
      "last_updated": column(row, "Last Updated"),
      "date_designated": column(row, "Date Designated"),
    };
    const group = groups.get(id);
    if (!group) {
      groups.set(id, {
        primary: name, primaryKind: kind, aliases: [], programs: regime ? [regime] : [],
        subjectType: type || null, primaryDetails: details,
      });
    } else {
      if (regime) group.programs.push(regime);
      if (type && !group.subjectType) group.subjectType = type;
      if (kind > group.primaryKind) {
        group.aliases.push(group.primary);
        group.primary = name;
        group.primaryKind = kind;
        group.primaryDetails = details;
      } else if (name !== group.primary) group.aliases.push(name);
    }
  }
  if (!groups.size) throw new Error("UKSL CSV contained no designations");
  return [...groups.entries()].map(([id, group]) => ({
    source_code: source.code, source_entry_id: id, subject_name: group.primary,
    subject_type: group.subjectType, programs: uniqueSorted(group.programs),
    aliases: uniqueSorted(group.aliases.filter((name) => name !== group.primary)),
    identifying_data: group.primaryDetails, source_url: source.source_url, content_hash: "",
  }));
}

export function parseSanctionsCsv(source: SanctionsSource, input: string): SanctionsEntry[] {
  if (source.code === "ofac_sdn" || source.code === "ofac_non_sdn") return ofacCsv(source, input);
  if (source.code === "uk_sanctions") return ukCsv(source, input);
  throw new Error(`No approved CSV parser for source ${source.code}`);
}

export function validateSnapshot(entries: SanctionsEntry[], minimum = 10): void {
  if (entries.length < minimum) throw new Error(`Unexpectedly small sanctions snapshot (${entries.length})`);
  const ids = new Set(entries.map((entry) => entry.source_entry_id));
  if (ids.size !== entries.length) throw new Error("Duplicate identifiers in sanctions snapshot");
  if (entries.some((entry) => !entry.subject_name || !entry.source_entry_id)) throw new Error("Missing designation identifier or name");
}
