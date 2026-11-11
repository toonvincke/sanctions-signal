// SS-013: Conservative EUR-Lex RSS candidate screening.
// Metadata-only triage; nothing here authorizes publication.
export const EURLEX_SOURCE_CODE = "eu_eurlex_oj_l_rss";
const explicit = /\brestrictive measures\b|\b(?:financial|economic|targeted) sanctions\b|\bassets? freez(?:e|ing)\b|\bfreezing of funds\b/i;
const possible = /\bembargo\b|\bsanctions?\b|\bsanctioned\b|\bprohibition on (?:the )?(?:export|import)\b|\bdual.use\b|\basset freeze\b/i;

export function eurlexScreen(title: string, description: string) {
  const evidence = `${title} ${description}`;
  if (explicit.test(evidence)) return { review: true, reason: "Explicit restrictive-measures or sanctions language" };
  if (possible.test(evidence)) return { review: true, reason: "Possible sanctions or trade-restriction terminology; verify original act" };
  return { review: false, reason: "No sanctions signal in feed metadata; not a complete relevance assessment" };
}

export function eurlexIdentity(url: string): string | null {
  // Derive only from the act's own URL, not from amended acts mentioned in summary.
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== "https:" || !["eur-lex.europa.eu", "data.europa.eu"].includes(u.hostname.toLowerCase())) return null;
  const decoded = decodeURIComponent(u.href);
  const match = decoded.match(/\bCELEX\s*:\s*(3\d{4}[RDL]\d{4,6})\b/i);
  return match ? match[1].toUpperCase() : null;
}
