import { strict as assert } from "node:assert";
import { eurlexIdentity, eurlexScreen } from "./eurlex-screen.ts";

Deno.test("flags explicit sanctions language for human review", () => {
  assert.equal(eurlexScreen("Council Regulation on restrictive measures", "").review, true);
});
Deno.test("keeps unrelated acts out of the review queue", () => {
  assert.equal(eurlexScreen("Regulation on food labelling", "Standards for packaging").review, false);
});
Deno.test("flags ambiguous trade restrictions for review, not publication", () => {
  assert.equal(eurlexScreen("Prohibition on export of certain equipment", "").review, true);
});
Deno.test("extracts own CELEX from legal act URL", () => {
  assert.equal(eurlexIdentity("https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32026R1234"), "32026R1234");
});
Deno.test("does not identify document from external or generic URLs", () => {
  assert.equal(eurlexIdentity("https://example.org/?uri=CELEX:32026R1234"), null);
  assert.equal(eurlexIdentity("https://eur-lex.europa.eu/oj/direct-access.html"), null);
});
