-- Stripe billing test-mode integration. Review live schema before applying.
-- Only the service role may update entitlements. No app user can call this function.
CREATE TABLE IF NOT EXISTS private.stripe_processed_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.stripe_processed_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON private.stripe_processed_events TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_unique
  ON public.user_subscriptions (provider_customer_id) WHERE provider_customer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.apply_stripe_subscription_event(
  p_event_id text,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_status text,
  p_period_end timestamptz,
  p_plan text,
  p_cancel_at_period_end boolean
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE inserted_count integer;
BEGIN
  IF p_event_id !~ '^evt_[a-zA-Z0-9]+$'
     OR p_customer_id !~ '^cus_[a-zA-Z0-9]+$'
     OR p_subscription_id !~ '^sub_[a-zA-Z0-9]+$'
     OR p_status NOT IN ('active','trialing','past_due','canceled','expired')
     OR p_plan NOT IN ('premium_monthly','premium_annual')
     OR p_period_end IS NULL THEN
    RAISE EXCEPTION 'Invalid Stripe subscription event';
  END IF;
  INSERT INTO private.stripe_processed_events (event_id) VALUES (p_event_id)
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN RETURN false; END IF;

  -- Refuse reassignment of a Stripe customer/subscription to another user.
  IF EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE (provider_customer_id = p_customer_id OR provider_subscription_id = p_subscription_id)
      AND user_id <> p_user_id
  ) THEN RAISE EXCEPTION 'Stripe identity collision'; END IF;

  INSERT INTO public.user_subscriptions
    (user_id, plan, status, current_period_end, cancel_at_period_end, provider_customer_id, provider_subscription_id, updated_at)
  VALUES
    (p_user_id, p_plan, p_status, p_period_end, p_cancel_at_period_end, p_customer_id, p_subscription_id, now())
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    provider_customer_id = EXCLUDED.provider_customer_id,
    provider_subscription_id = EXCLUDED.provider_subscription_id,
    updated_at = now();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_stripe_subscription_event(text,uuid,text,text,text,timestamptz,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_subscription_event(text,uuid,text,text,text,timestamptz,text,boolean) TO service_role;
