// Turns raw auth errors into messages a subscriber can act on.
export function friendlyAuthError(err: unknown): string {
  const raw =
    err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err ?? "");
  const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code ?? "") : "";
  const m = raw.toLowerCase();

  if (code === "invalid_credentials" || m.includes("invalid login credentials"))
    return "That email and password don't match. Check them or reset your password.";
  if (code === "email_not_confirmed" || m.includes("email not confirmed"))
    return "Please confirm your email first. Use the link we sent you, or resend it below.";
  if (code === "user_already_exists" || m.includes("already registered"))
    return "An account with this email already exists. Sign in instead.";
  if (code === "weak_password" || m.includes("pwned") || m.includes("weak") || m.includes("known to be"))
    return "That password is too weak or has appeared in a data breach. Choose a longer, unique password.";
  if (code === "same_password" || m.includes("should be different"))
    return "The new password must be different from your current one.";
  if (m.includes("current password") || code === "reauthentication_needed")
    return "Your current password is incorrect.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || m.includes("rate limit"))
    return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("invalid email") || code === "email_address_invalid") return "Please enter a valid email address.";
  if (m.includes("expired") || code === "otp_expired")
    return "This link has expired or was already used. Request a new one.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "We couldn't reach the server. Check your connection and try again.";
  return raw || "Something went wrong. Please try again.";
}
