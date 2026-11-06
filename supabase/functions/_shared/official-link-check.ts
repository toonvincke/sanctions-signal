/** SS-024: bounded official-source link check. Input is curated, never user-defined. */
const ALLOWED = [
  "eur-lex.europa.eu", "consilium.europa.eu", "ec.europa.eu",
  "ofac.treasury.gov", "treasury.gov", "gov.uk", "legislation.gov.uk",
  "main.un.org", "un.org", "bis.gov", "justice.gov",
];
export function safeOfficialUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        url.hash || url.hostname.endsWith(".") || !ALLOWED.some(
          host => url.hostname === host || url.hostname.endsWith("." + host))) return null;
    return url;
  } catch { return null; }
}
export type LinkStatus = "ok" | "redirected" | "broken" | "blocked" | "unavailable";
export type LinkResult = {
  url: string; status: LinkStatus; http_status?: number;
  redirect?: string; checked_at: string;
};

function result(url: string, checked_at: string, status: LinkStatus,
                http_status?: number, redirect?: string): LinkResult {
  return { url, status, ...(http_status === undefined ? {} : { http_status }),
    ...(redirect ? { redirect } : {}), checked_at };
}

export async function probeOfficialLink(urlText: string, fetcher: typeof fetch = fetch): Promise<LinkResult> {
  const checked_at = new Date().toISOString();
  const original = safeOfficialUrl(urlText);
  if (!original) return result(urlText, checked_at, "blocked");
  let current = original;
  for (let i = 0; i <= 3; i++) {
    try {
      let response = await fetcher(current.toString(), {
        method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(8000),
      });
      // Some publishers reject HEAD, in which case request a minimal response.
      if (response.status === 405 || response.status === 501) {
        response = await fetcher(current.toString(), {
          method: "GET", redirect: "manual", signal: AbortSignal.timeout(8000),
          headers: { Range: "bytes=0-0" },
        });
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return result(urlText, checked_at, "unavailable", response.status);
        const next = safeOfficialUrl(new URL(location, current).toString());
        if (!next) return result(urlText, checked_at, "blocked", response.status);
        current = next;
        continue;
      }
      if (response.ok) return result(urlText, checked_at, i ? "redirected" : "ok", response.status,
        i ? current.toString() : undefined);
      if (response.status === 404 || response.status === 410)
        return result(urlText, checked_at, "broken", response.status);
      if ([401, 403, 429].includes(response.status))
        return result(urlText, checked_at, "blocked", response.status);
      return result(urlText, checked_at, "unavailable", response.status);
    } catch {
      return result(urlText, checked_at, "unavailable");
    }
  }
  return result(urlText, checked_at, "unavailable");
}
