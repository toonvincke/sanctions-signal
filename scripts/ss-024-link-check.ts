/**
 * SS-024: a deliberately read-only official-link probe.
 * Run with: bun scripts/ss-024-check-links.ts < inventory.json
 * Input: JSON array of {programme, url} or {programmes:[{jurisdiction,slug,verified_programme_url}]}.
 * This tool does not change publication status or auto-approve a citation.
 */
const ALLOWED = ["eur-lex.europa.eu","consilium.europa.eu","ec.europa.eu","ofac.treasury.gov",
 "treasury.gov","gov.uk","legislation.gov.uk","main.un.org","un.org","bis.gov","justice.gov"];
export function safeOfficialUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.hash || url.hostname.endsWith(".") || !ALLOWED.some(h => url.hostname === h || url.hostname.endsWith("." + h))) return null;
    return url;
  } catch { return null; }
}
export type LinkStatus = "ok" | "redirected" | "broken" | "blocked";
export async function probeOfficialLink(urlText: string, fetcher: typeof fetch = fetch): Promise<{url:string; status:LinkStatus; http_status?:number; redirect?:string; checked_at:string}> {
 const checked_at = new Date().toISOString();
 const original = safeOfficialUrl(urlText);
 if (!original) return {url:urlText,status:"blocked",checked_at};
 let current = original;
 for (let i=0;i<=3;i++) {
  try {
   const response = await fetcher(current.toString(), {method:"HEAD",redirect:"manual",signal:AbortSignal.timeout(8000)});
   if (response.status >=300 && response.status <400) {
    const location=response.headers.get("location");
    if (!location) return {url:urlText,status:"broken",http_status:response.status,checked_at};
    const next=safeOfficialUrl(new URL(location,current).toString());
    if (!next) return {url:urlText,status:"blocked",http_status:response.status,checked_at};
    current=next;continue;
   }
   if (response.status === 405 || response.status === 501) {
    const getResponse = await fetcher(current.toString(),{method:"GET",redirect:"manual",signal:AbortSignal.timeout(8000),headers:{"Range":"bytes=0-0"}});
    return {url:urlText,status:getResponse.ok?(i?"redirected":"ok"):"broken",http_status:getResponse.status,redirect:i?current.toString():undefined,checked_at};
   }
   return {url:urlText,status:response.ok?(i?"redirected":"ok"):"broken",http_status:response.status,redirect:i?current.toString():undefined,checked_at};
  } catch {
   return {url:urlText,status:"broken",checked_at};
  }
 }
 return {url:urlText,status:"broken",checked_at};
}
