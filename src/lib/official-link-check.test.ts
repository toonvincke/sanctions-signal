import { describe, expect, it } from "vitest";
import { probeOfficialLink, safeOfficialUrl } from "../../scripts/ss-024-link-check";

describe("SS-024 official source probes", () => {
 it("rejects malicious and untrusted destinations", () => {
  for (const url of ["http://ofac.treasury.gov/a","https://ofac.treasury.gov.evil.test/a",
   "https://evil.test/a","https://user:pass@ofac.treasury.gov/a","https://127.0.0.1/a"]) {
   expect(safeOfficialUrl(url)).toBeNull();
  }
  expect(safeOfficialUrl("https://ofac.treasury.gov/sanctions-programs-and-country-information")).not.toBeNull();
 });
 it("never follows redirects to an untrusted host", async () => {
  const mock = (async () => new Response(null,{status:302,headers:{location:"https://evil.test/private"}})) as typeof fetch;
  const r = await probeOfficialLink("https://ofac.treasury.gov/sanctions-programs-and-country-information",mock);
  expect(r.status).toBe("blocked");
 });
 it("does not equate HTTP 202 Accepted with a verified official page", async () => {
  const mock = (async () => new Response(null,{status:202})) as typeof fetch;
  const r = await probeOfficialLink("https://main.un.org/securitycouncil/en/sanctions/1267",mock);
  expect(r.status).toBe("unavailable");
 });
 it("records a healthy response", async () => {
  const mock = (async () => new Response(null,{status:200})) as typeof fetch;
  const r=await probeOfficialLink("https://eur-lex.europa.eu/eli/reg/2014/833/oj",mock);
  expect(r.status).toBe("ok");
  expect(r.http_status).toBe(200);
 });
 it("marks only definite 404/410 as broken, not temporary server errors", async () => {
  const url = "https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions";
  for (const code of [404, 410]) {
   const mock=(async () => new Response(null,{status:code})) as typeof fetch;
   expect((await probeOfficialLink(url,mock)).status).toBe("broken");
  }
  for (const code of [500, 502, 503]) {
   const mock=(async () => new Response(null,{status:code})) as typeof fetch;
   expect((await probeOfficialLink(url,mock)).status).toBe("unavailable");
  }
 });
 it("treats rate limits and anti-bot blocks as inconclusive rather than broken", async () => {
  const url = "https://ofac.treasury.gov/sanctions-programs-and-country-information";
  for (const code of [401, 403, 429]) {
    const mock=(async () => new Response(null,{status:code})) as typeof fetch;
    expect((await probeOfficialLink(url,mock)).status).toBe("blocked");
  }
 });
 it("does not turn connection errors into invalid-source decisions", async () => {
   const mock=(async () => { throw new Error("Timeout"); }) as typeof fetch;
   expect((await probeOfficialLink("https://www.gov.uk/government/publications/the-uk-sanctions-list",mock)).status).toBe("unavailable");
 });
 it("follows redirects only to approved official domains", async () => {
   const mock=(async (input: RequestInfo | URL) => {
     const url = String(input);
     return url.includes("ofac.treasury.gov") ?
       new Response(null,{status:301,headers:{location:"https://www.gov.uk/government/publications/the-uk-sanctions-list"}})
       : new Response(null,{status:200});
   }) as typeof fetch;
   const r=await probeOfficialLink("https://ofac.treasury.gov/sanctions-programs-and-country-information",mock);
   expect(r.status).toBe("redirected");
   expect(r.redirect).toContain("gov.uk");
 });

});
