import { REGIMES, type Program, type RegimeSlug } from "@/lib/sanctions-programs";

/** Stable URL identifier derived from the programme's published display name. */
export function programmeSlug(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export type ProgrammeDetail = {
  jurisdiction: RegimeSlug;
  programme: Program;
  slug: string;
  group: string;
};

export const PROGRAMME_DETAILS: ProgrammeDetail[] = (Object.keys(REGIMES) as RegimeSlug[])
  .flatMap((jurisdiction) => REGIMES[jurisdiction].groups.flatMap((group) =>
    group.programs.map((programme) => ({
      jurisdiction,
      programme,
      slug: programmeSlug(programme.name),
      group: group.heading,
    }))
  ));

const programmeMap = new Map(
  PROGRAMME_DETAILS.map((entry) => [`${entry.jurisdiction}/${entry.slug}`, entry])
);

export function getProgrammeDetail(jurisdiction: string, slug: string): ProgrammeDetail | undefined {
  return programmeMap.get(`${jurisdiction}/${slug}`);
}

/**
 * These are jurisdiction-wide official entry points, not verified programme-specific
 * legal citations. Source metadata and document-level linking are handled in SS-023.
 */
export const OFFICIAL_LEGAL_PORTALS: Record<RegimeSlug, { label: string; url: string }> = {
  eu: { label: "EUR-Lex — EU legislation", url: "https://eur-lex.europa.eu/" },
  us: { label: "OFAC — sanctions programmes", url: "https://ofac.treasury.gov/sanctions-programs-and-country-information" },
  uk: { label: "UK legislation", url: "https://www.legislation.gov.uk/" },
  un: { label: "UN Security Council sanctions", url: "https://main.un.org/securitycouncil/en/sanctions/information" },
};
