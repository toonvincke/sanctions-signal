export type OfficialSourceInput = {
  url: string;
  publisher: string;
  sourceType: "legislation" | "guidance" | "case_law" | "enforcement" | "official_notice";
  sourceDate: string;
  programmeSlug: string;
  title: string;
};

const TRUSTED_HOSTS = [
  "eur-lex.europa.eu", "consilium.europa.eu", "ec.europa.eu",
  "ofac.treasury.gov", "treasury.gov", "gov.uk", "legislation.gov.uk",
  "main.un.org", "un.org", "bis.gov", "justice.gov",
];

/** Structural preflight only: source authenticity and document identity require server validation. */
export function validateOfficialSource(input: OfficialSourceInput): boolean {
  try {
    const url = new URL(input.url);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    if (!TRUSTED_HOSTS.some((trusted) => host === trusted || host.endsWith("." + trusted))) return false;
    if (!input.publisher.trim() || !input.title.trim() || !input.programmeSlug.trim()) return false;
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(input.sourceDate)) return false;
    const date = new Date(input.sourceDate + "T00:00:00Z");
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.sourceDate) return false;
    return true;
  } catch { return false; }
}

export function canPublishEditorial(status: string, reviewerId: string | null, reviewedAt: string | null): boolean {
  return status === "approved" && Boolean(reviewerId && reviewedAt);
}
