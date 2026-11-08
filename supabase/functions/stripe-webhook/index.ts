import { billingEnv, response, stripeRequest } from "../_shared/stripe-runtime.ts";
import { verifyStripeSignature } from "../_shared/stripe-signature.ts";

type StripeEvent = { id?: string; type?: string; livemode?: boolean; created?: number; data?: { object?: Record<string, unknown> } };
const accepted = new Set(["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  let config: ReturnType<typeof billingEnv>;
  try { config = billingEnv(); } catch { return response({ error: "Billing is not configured" }, 503); }
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const raw = await req.text();
  if (!(await verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret))) {
    return response({ error: "Invalid signature" }, 400);
  }
  let event: StripeEvent;
  try { event = JSON.parse(raw); } catch { return response({ error: "Invalid payload" }, 400); }
  if (event.livemode !== false || !event.id?.startsWith("evt_") || !event.type || !accepted.has(event.type)) return response({ received: true });
  const obj = event.data?.object;
  if (!obj) return response({ error: "Missing event object" }, 400);
  let subscriptionId: string | null = null;
  if (event.type === "checkout.session.completed" && obj.mode === "subscription" && typeof obj.subscription === "string") {
    subscriptionId = obj.subscription;
  } else if (event.type.startsWith("customer.subscription.") && typeof obj.id === "string") {
    subscriptionId = obj.id;
  } else if (event.type.startsWith("invoice.")) {
    // Stripe invoice shape differs by API version; fetch subscriber state only when
    // an explicit subscription ID is present, otherwise await subscription.updated.
    if (typeof obj.subscription === "string") subscriptionId = obj.subscription;
  }
  if (!subscriptionId || !/^sub_[a-zA-Z0-9]+$/.test(subscriptionId)) return response({ received: true });
  try {
    // Retrieve current Stripe state rather than trusting possibly out-of-order event data.
    const subscription = await stripeRequest(config.stripeKey, `subscriptions/${subscriptionId}`);
    const metadata = subscription.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.app_user_id;
    const customerId = subscription.customer;
    const items = subscription.items as { data?: Array<{ current_period_end?: number }> } | undefined;
    const periodEnd = subscription.current_period_end ?? items?.data?.[0]?.current_period_end;
    if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId) ||
        typeof customerId !== "string" || !/^cus_[a-zA-Z0-9]+$/.test(customerId) ||
        typeof periodEnd !== "number" || !Number.isFinite(periodEnd)) {
      throw new Error("Invalid subscription identity or period");
    }
    const status = String(subscription.status);
    const allowed = ["active", "trialing", "past_due", "canceled", "incomplete", "incomplete_expired", "unpaid", "paused"];
    if (!allowed.includes(status)) throw new Error("Unsupported subscription status");
    const mappedStatus = status === "active" || status === "trialing" || status === "past_due" || status === "canceled" ? status : "expired";
    const price = (items as { data?: Array<{ price?: { id?: string } }> } | undefined)?.data?.[0]?.price?.id;
    const monthly = Deno.env.get("STRIPE_PRICE_MONTHLY");
    const annual = Deno.env.get("STRIPE_PRICE_ANNUAL");
    if (!price || !monthly || !annual || ![monthly, annual].includes(price)) throw new Error("Unexpected Stripe price");
    const { error } = await config.admin.rpc("apply_stripe_subscription_event", {
      p_event_id: event.id,
      p_user_id: userId,
      p_customer_id: customerId,
      p_subscription_id: subscriptionId,
      p_status: mappedStatus,
      p_period_end: new Date(periodEnd * 1000).toISOString(),
      p_plan: price === monthly ? "premium_monthly" : "premium_annual",
      p_cancel_at_period_end: subscription.cancel_at_period_end === true,
    });
    if (error) throw error;
    return response({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Reconciliation failed", error instanceof Error ? error.message : String(error));
    return response({ error: "Reconciliation failed; Stripe may retry" }, 500);
  }
});
