/** Deno/Web Crypto-compatible Stripe webhook raw-body signature validation. */
export async function verifyStripeSignature(body: string, signature: string | null, secret: string, now = Date.now()): Promise<boolean> {
  if (!signature || !secret.startsWith("whsec_")) return false;
  const fields = signature.split(",").map((part) => part.trim().split("="));
  const t = fields.find(([key]) => key === "t")?.[1];
  const values = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!t || !/^\d+$/.test(t) || values.length === 0) return false;
  const timestamp = Number(t);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 300) return false;
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", bytes.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes.encode(`${t}.${body}`)));
  let match = false;
  for (const value of values) {
    if (!/^[a-f0-9]{64}$/i.test(value)) continue;
    const supplied = Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ supplied[i];
    match ||= difference === 0;
  }
  return match;
}
