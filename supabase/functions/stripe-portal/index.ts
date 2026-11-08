import { authenticatedUser, billingEnv, corsHeaders, response, stripeRequest, verifiedCustomer } from "../_shared/stripe-runtime.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "OPTIONS") return response({ error: "Method not allowed" }, 405);
  let config: ReturnType<typeof billingEnv>;
  try { config = billingEnv(); } catch { return response({ error: "Billing is not configured" }, 503); }
  const headers = corsHeaders(req, config.appOrigin);
  if (req.headers.get("origin") !== config.appOrigin) return response({ error: "Invalid origin" }, 403, headers);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const user = await authenticatedUser(req, config.admin);
  if (!user) return response({ error: "Sign in required" }, 401, headers);
  try {
    const current = await verifiedCustomer(config.admin, user.id);
    if (!current?.provider_customer_id) return response({ error: "No billing account found" }, 404, headers);
    if (!/^cus_[a-zA-Z0-9]+$/.test(current.provider_customer_id)) throw new Error("Invalid customer mapping");
    const session = await stripeRequest(config.stripeKey, "billing_portal/sessions", new URLSearchParams({
      customer: current.provider_customer_id,
      return_url: `${config.appOrigin}/pricing`,
    }));
    const url = String(session.url ?? "");
    if (!url.startsWith("https://billing.stripe.com/")) throw new Error("Invalid portal URL");
    return response({ url }, 200, headers);
  } catch { return response({ error: "Billing portal unavailable" }, 503, headers); }
});
