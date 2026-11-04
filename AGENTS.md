<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Intelligence content lives in `intelligence_records` with FK lookups (jurisdictions, regimes, authorities) and a `record_categories` join; readable by authenticated users only via RLS. Why: portal content is subscriber-only, marketing pages stay public.
- Each record keeps `source_facts` separate from `practical_implications` (analysis) and carries `legal_status` + `verification_status`. Why: the product must never blur verified facts with interpretation.
- Admin permission comes only from `public.user_roles`; RLS policies call `private.has_role()` (schema not exposed via the API) and server code queries `user_roles`, never auth metadata. Why: one admin system, and role helpers can't be called by clients.
- Portal data reads use browser Supabase client query options in `src/lib/intel.ts` under the `ssr:false` `_authenticated` layout. Why: session lives in localStorage; RLS enforces access.
