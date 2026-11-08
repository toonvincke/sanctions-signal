// Pure JavaScript parser for Supabase/Lovable Edge Functions (no canvas/native modules).
// Keep the version pinned; avoid esm.sh transitive dependency surprises.
import { XMLParser, XMLValidator } from "npm:fast-xml-parser@5.11.2";
import type { SanctionsEntry, SanctionsSource } from "./sanctions-parsers.ts";

type XmlValue = string | number | boolean | null | undefined | XmlObject | XmlValue[];
interface XmlObject { [key: string]: XmlValue; }
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
});

const obj = (value: XmlValue): XmlObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value as XmlObject : {};
const list = (value: XmlValue): XmlValue[] => value == null ? [] : Array.isArray(value) ? value : [value];
const str = (value: XmlValue): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && !Array.isArray(value)) return str(value["#text"]);
  return "";
};
const children = (parent: XmlValue, name: string): XmlValue[] => list(obj(parent)[name]);
const field = (parent: XmlValue, name: string): string => str(obj(parent)[name]);

export function parseXmlDocument(xml: string): XmlObject {
  // Reject DTD-defined/remote entities. Official feeds do not require them.
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw new Error("XML DTD/entity declarations are not allowed");
  const validity = XMLValidator.validate(xml);
  if (validity !== true) throw new Error("Malformed XML: " + (typeof validity === "object" ? validity.err?.msg : String(validity)));
  return obj(parser.parse(xml) as XmlValue);
}

export function parseUnConsolidated(source: SanctionsSource, xml: string): SanctionsEntry[] {
  const root = obj(parseXmlDocument(xml).CONSOLIDATED_LIST);
  if (!Object.keys(root).length) throw new Error("Unexpected UN XML root");
  const result: SanctionsEntry[] = [];
  const personNodes = children(root.INDIVIDUALS, "INDIVIDUAL");
  const entityNodes = children(root.ENTITIES, "ENTITY");
  for (const [nodes, individual] of [[personNodes, true], [entityNodes, false]] as const) {
    for (const [index, node] of nodes.entries()) {
      const id = field(node, individual ? "INDIVIDUAL_ID" : "ENTITY_ID") || field(node, "REFERENCE_NUMBER");
      const name = individual
        ? ["FIRST_NAME", "SECOND_NAME", "THIRD_NAME", "FOURTH_NAME"].map((k) => field(node, k)).filter(Boolean).join(" ")
        : field(node, "ENTITY_NAME");
      if (!id || !name) {
        const kind = individual ? "individual" : "entity";
        const missing = [!id ? "ID" : "", !name ? "name" : ""].filter(Boolean).join(" and ");
        throw new Error(`UN ${kind} record ${index + 1} missing ${missing}; refusing incomplete snapshot`);
      }
      const aliases = children(node, individual ? "INDIVIDUAL_ALIAS" : "ENTITY_ALIAS")
        .map((alias) => field(alias, "ALIAS_NAME")).filter(Boolean);
      const nationality = children(node, "NATIONALITY").map((n) => field(n, "VALUE")).filter(Boolean);
      const dob = children(node, "INDIVIDUAL_DATE_OF_BIRTH")
        .map((n) => field(n, "DATE") || field(n, "YEAR")).filter(Boolean);
      result.push({
        source_code: source.code,
        source_entry_id: id,
        subject_name: name,
        subject_type: individual ? "individual" : "entity",
        programs: [field(node, "UN_LIST_TYPE")].filter(Boolean),
        aliases: [...new Set(aliases)].sort(),
        identifying_data: {
          reference_number: field(node, "REFERENCE_NUMBER"),
          listed_on: field(node, "LISTED_ON"),
          comments: field(node, "COMMENTS1"),
          nationality,
          date_of_birth: dob,
        },
        source_url: source.source_url,
        content_hash: "",
      });
    }
  }
  if (!result.length) throw new Error("UN XML contained no designations");
  return result;
}

export type Publication = {
  title: string;
  url: string;
  date: string;
  description: string;
};

function atomLink(value: XmlValue): string {
  const links = list(value);
  const chosen = links.find((link) => {
    const rel = field(link, "@_rel");
    return !rel || rel === "alternate";
  }) ?? links[0];
  return field(chosen, "@_href") || str(chosen);
}

export function parsePublicationFeed(xml: string): Publication[] {
  const doc = parseXmlDocument(xml);
  const rss = obj(doc.rss);
  const atom = obj(doc.feed);
  const rdf = obj(doc["rdf:RDF"]);
  if (Object.keys(rss).length) {
    return children(obj(rss.channel), "item").map((item) => ({
      title: field(item, "title"),
      url: field(item, "link"),
      date: field(item, "pubDate") || field(item, "dc:date"),
      description: field(item, "description") || field(item, "content:encoded"),
    }));
  }
  if (Object.keys(atom).length) {
    return children(atom, "entry").map((item) => ({
      title: field(item, "title"),
      url: atomLink(obj(item).link),
      date: field(item, "published") || field(item, "updated"),
      description: field(item, "summary") || field(item, "content"),
    }));
  }
  if (Object.keys(rdf).length) {
    return children(rdf, "item").map((item) => ({
      title: field(item, "title"),
      url: field(item, "link"),
      date: field(item, "dc:date"),
      description: field(item, "description"),
    }));
  }
  throw new Error("Unsupported RSS/Atom feed format");
}
