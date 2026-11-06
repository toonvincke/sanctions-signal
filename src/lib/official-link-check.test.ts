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
 it("records a healthy response", async () => {
  const mock = (async () => new Response(null,{status:200})) as typeof fetch;
  const r=await probeOfficialLink("https://eur-lex.europa.eu/eli/reg/2014/833/oj",mock);
  expect(r.status).toBe("ok");
  expect(r.http_status).toBe(200);
 });
});
