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

## Cost-efficient development policy (Sanctions Signal)
These are default working instructions for AI agents and contributors. Preserve all architecture, security, privacy and approval requirements above; cost optimization never overrides safety.

- **GitHub first:** Read, investigate, and review source code through GitHub or a local checkout. Make code changes on dedicated branches and open PRs; do not merge, deploy or publish without the user's explicit approval.
- **Tests in GitHub Actions:** Prefer existing unit/integration suites and CI logs. Develop missing automated tests as GitHub scripts/workflows. Avoid re-running equivalent tests without a code change or new evidence.
- **Source and URL verification:** Run official-source, link, and sanctions-programme checks with existing GitHub Actions/scripts. Record failures and coverage in issues/PRs; do not default to Lovable browser automation for bulk URL checks.
- **Database changes:** Draft migrations in GitHub, review rollback/backup/data risks, and test in isolation. Apply migrations through an authorized direct database connection when available and safe. Request specific user action when credentials or capabilities are unavailable; do not work around safeguards.
- **Lovable only when required:** Use Lovable for editor-specific features, preview/browser checks not feasible with other accessible tools, Lovable-hosted deployments, and proprietary backend operations when no safe direct alternative exists. Prefer GitHub for visual code changes when possible.
- **Credit-conscious escalation:** Before using the Lovable AI agent, determine whether GitHub, CI, scripts, or direct integrations can accomplish the same task. Explain what is blocked and why Lovable is needed. Do not repeatedly submit Lovable prompts after an unchanged blocker; create or update a tracked issue instead.
- **Clear reporting:** Each work summary should state what was done through GitHub/CI versus Lovable, whether any Lovable AI-agent request was made, which checks ran, and what remains unverified. Never claim zero credits definitively without usage/billing evidence.
- **Stable workflow:** Keep production and staging distinct, verify the exact repo branch/commit and target before modifying either, and avoid unnecessary Lovable-GitHub resynchronization loops.
