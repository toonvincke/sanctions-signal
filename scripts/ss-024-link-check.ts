/** Re-export the production link validator for cataloguing and shared unit tests. */
export { safeOfficialUrl, probeOfficialLink } from "../supabase/functions/_shared/official-link-check";
export type { LinkResult, LinkStatus } from "../supabase/functions/_shared/official-link-check";
