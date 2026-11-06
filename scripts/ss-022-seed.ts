import { PROGRAMME_DETAILS } from "../src/lib/programme-detail";

/** Generate reviewable, repeatable catalogue backfill SQL; does not connect to any database. */
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const values = PROGRAMME_DETAILS.map(({ jurisdiction, slug, programme, group }) =>
  "(" + [jurisdiction, slug, programme.name, group].map(quote).join(", ") + ")"
);
if (new Set(PROGRAMME_DETAILS.map(p => p.jurisdiction + "/" + p.slug)).size !== PROGRAMME_DETAILS.length) {
  throw new Error("Duplicate programme key; refusing to generate seed");
}
process.stdout.write(
  "-- SS-022: generated from current static catalogue; review before applying.\\n".replace("\\n","\n") +
  "INSERT INTO public.sanctions_programmes (jurisdiction, slug, name, group_name) VALUES\n" +
  values.join(",\n") +
  "\nON CONFLICT (jurisdiction, slug) DO UPDATE SET name = EXCLUDED.name, group_name = EXCLUDED.group_name, updated_at = now();\n"
);
