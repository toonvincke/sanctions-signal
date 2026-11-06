import { PROGRAMME_DETAILS, OFFICIAL_LEGAL_PORTALS } from "../src/lib/programme-detail";

/** Catalogue-wide source coverage inventory. Never equate a portal with a verified programme citation. */
const quote = (v: string) => "'" + v.replaceAll("'", "''") + "'";
const rows = PROGRAMME_DETAILS.map((p) => ({
  jurisdiction: p.jurisdiction, slug: p.slug, name: p.programme.name,
  stated_basis: p.programme.basis ?? null,
  verified_programme_url: null,
  mapping_status: "needs_mapping",
  jurisdiction_portal: OFFICIAL_LEGAL_PORTALS[p.jurisdiction].url,
}));
const unique = new Set(rows.map((r) => r.jurisdiction + "/" + r.slug));
if (unique.size !== rows.length) throw new Error("Duplicate programme key");
const counts = rows.reduce<Record<string, number>>((acc, r) => {
  acc[r.jurisdiction] = (acc[r.jurisdiction] ?? 0) + 1; return acc;
}, {});
const args = process.argv.slice(2);
if (args.includes("--json")) {
  process.stdout.write(JSON.stringify({ count: rows.length, by_jurisdiction: counts, programmes: rows }, null, 2) + "\n");
} else if (args.includes("--sql")) {
  // Only initialize catalogue coverage state for unverified programme records.
  // Do not change any curator-reviewed 'mapped' or 'link_broken' state.
  process.stdout.write("-- SS-024: mark existing programmes with no source mapping. Never auto-verify.\n");
  process.stdout.write("UPDATE public.sanctions_programmes SET source_mapping_status='needs_mapping' WHERE source_mapping_status IS NULL;\n");
  process.stdout.write("SELECT jurisdiction, count(*) AS total, count(*) FILTER (WHERE source_mapping_status='needs_mapping') AS needs_mapping FROM public.sanctions_programmes GROUP BY jurisdiction ORDER BY jurisdiction;\n");
} else {
  process.stdout.write("SS-024 source coverage inventory: " + rows.length + " programme pages\n");
  for (const [jurisdiction, n] of Object.entries(counts)) process.stdout.write(jurisdiction + ": " + n + "\n");
  process.stdout.write("No programme-specific URL is automatically marked verified. Use --json for a reviewable inventory or --sql for a non-destructive coverage query.\n");
}
