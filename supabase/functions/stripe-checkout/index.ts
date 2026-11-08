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
  const input = await req.json().catch(() => null);
  const interval = input && typeof input === "object" && input.interval;
  if (interval !== "monthly" && interval !== "annual") return response({ error: "Invalid billing interval" }, 400, headers);
  const price = interval === "monthly" ? Deno.env.get("STRIPE_PRICE_MONTHLY") : Deno.env.get("STRIPE_PRICE_ANNUAL");
  if (!price || !/^price_[a-zA-Z0-9]+$/.test(price)) return response({ error: "Billing price not configured" }, 503, headers);
  try {
    const current = await verifiedCustomer(config.admin, user.id);
    // Never create a second subscription while an existing Stripe subscription needs management.
    if (current?.provider_subscription_id) return response({ error: "Subscription already exists. Use billing portal." }, 409, headers);
    const params = new URLSearchParams({
      mode: "subscription", "line_items[0][price]": price, "line_items[0][quantity]": "1",
      client_reference_id: user.id, "subscription_data[metadata][app_user_id]": user.id,
      success_url: `${config.appOrigin}/pricing?checkout=success`,
      cancel_url: `${config.appOrigin}/pricing?checkout=cancel`,
    });
    if (current?.provider_customer_id) params.set("customer", current.provider_customer_id);
    else if (user.email) params.set("customer_email", user.email);
    const session = await stripeRequest(config.stripeKey, "checkout/sessions", params);
    const url = String(session.url ?? "");
    if (!url.startsWith("https://checkout.stripe.com/")) throw new Error("Invalid checkout URL");
    return response({ url }, 200, headers);
  } catch { return response({ error: "Checkout unavailable" }, 503, headers); }
});
