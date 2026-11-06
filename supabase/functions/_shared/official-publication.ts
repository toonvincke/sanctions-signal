export type OfficialSourceInput = {
  url: string;
  publisher: string;
  sourceType: "legislation" | "executive_order" | "guidance" | "faq" |
    "licensing" | "ruling" | "enforcement" | "resolution" | "other";
  sourceDate: string;
  programmeSlug: string;
  title: string;
};

const TRUSTED_HOSTS = [
  "eur-lex.europa.eu", "consilium.europa.eu", "ec.europa.eu",
  "ofac.treasury.gov", "treasury.gov", "sanctionslistservice.ofac.treas.gov",
  "gov.uk", "legislation.gov.uk", "main.un.org", "un.org",
  "bis.gov", "justice.gov",
];

/** Structural whitelist only: does not assert legal validity or interpretation. */
export function validateOfficialSource(input: OfficialSourceInput): boolean {
  try {
    const url = new URL(input.url);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.hash || !url.pathname || url.pathname === "/") return false;
    const host = url.hostname.toLowerCase();
    if (!TRUSTED_HOSTS.some((trusted) => host === trusted || host.endsWith("." + trusted))) return false;
    if (!input.publisher.trim() || !input.title.trim() || !input.programmeSlug.trim()) return false;
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(input.sourceDate)) return false;
    const date = new Date(input.sourceDate + "T00:00:00Z");
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.sourceDate) return false;
    if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) return false;
    return true;
  } catch { return false; }
}

export function canPublishEditorial(status: string, reviewerId: string | null, reviewedAt: string | null): boolean {
  return status === "approved" && Boolean(reviewerId && reviewedAt);
}
