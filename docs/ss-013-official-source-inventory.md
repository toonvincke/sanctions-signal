# SS-013 — Official sanctions intelligence source inventory

Status: initial verified inventory (2026-11-11). **Not** a claim that feeds are registered in Lovable Cloud or scheduled monitoring is live.

## Scope and editorial separation
Monitor **changes and publications**, not bulk sanctions-list sync. Keep separate event categories: legislation / designation change / guidance or FAQ / general or specific licence / court ruling / enforcement / press announcement. Bulk list snapshots belong to a separate ingestion pipeline.

## Initial verified official web sources

| Jurisdiction | Source | URL | Source type | Coverage | Access verified | API/RSS verified | Last checked |
|---|---|---|---|---|---|---|---|
| US | OFAC Recent Actions | https://ofac.treasury.gov/recent-actions/sanctions-list-updates | Official public web index | Designations, removals, and notices referencing FAQs/licences | Public page found | No | 2026-11-11 |
| US | OFAC Press Releases | https://ofac.treasury.gov/press-releases | Official public web index | Announcements and linked actions | Public page found | No | 2026-11-11 |
| UK | UK Sanctions List | https://www.gov.uk/government/publications/the-uk-sanctions-list | Official public updates page | Designations, amendments, revocations | Public page found | No | 2026-11-11 |
| UK | OFSI enforcement guidance | https://www.gov.uk/government/publications/financial-sanctions-enforcement-and-monetary-penalties-guidance/financial-sanctions-enforcement-and-monetary-penalties-guidance | Official guidance page | Enforcement policy updates | Public page found | No | 2026-11-11 |
| EU | European Commission sanctions implementation news | https://finance.ec.europa.eu/news/statement-commissioner-albuquerque-outcomes-tenth-meeting-high-level-meeting-sanctions-2026-11-06_en | Official publication example, not a feed | Implementation news | Public page found | No | 2026-11-11 |
| UN | UNSC consolidated list change log | https://main.un.org/securitycouncil/en/content/list-updates-unsc-consolidated-list | Official public index | Additions, removals and amendments | Public page found | No | 2026-11-11 |
| UN | Security Council resolutions | https://main.un.org/securitycouncil/en/content/resolutions-0 | Official public index | Resolutions, including sanctions | Public page found | No | 2026-11-11 |
| UN | ISIL/Al-Qaida committee press releases | https://main.un.org/securitycouncil/en/sanctions/1267/press-releases | Official committee public index | Committee announcements | Public page found | No | 2026-11-11 |

**Important:** EU regulatory coverage still requires dedicated EUR-Lex / Official Journal discovery and validation; UK OFSI penalty notices and OFAC enforcement and general-licence indexes need dedicated validation. The sources above are an initial selection, not complete coverage.

## Proposed source registry fields
`source_id`, `jurisdiction`, `authority`, `name`, `canonical_url`, `access_method` (html/rss/atom/api), `content_categories`, `official`, `enabled`, `check_interval_hours` (default 24), `last_checked_at`, `last_success_at`, `last_http_status`, `last_error`, `terms_or_access_notes`.

## Proposed deduplication
Prefer authority document identifiers (e.g., EU CELEX, UN document symbol, OFAC action URL) plus jurisdiction and event type. Otherwise use normalized canonical URL; use a content hash for revisions. Distinguish updated documents from genuinely new events. A press release and underlying legal act may be linked to one event, not published as duplicate alerts.

## Follow-up verification and acceptance gaps
1. Check live HTTP responses from the intended GitHub Actions runner (search-engine visibility is not equivalent to a successful programmatic fetch).
2. Discover and verify official RSS/Atom/API availability individually; do not infer API access from a public HTML page.
3. Extend inventory to EUR-Lex/OJ, Council of the EU, OFAC enforcement/licences/FAQs, UK OFSI penalties and legislation, UN sanctions committee updates.
4. Inspect existing Lovable Cloud source tables and register sources only after checking schema and access.
5. Record actual per-source check outcomes and timestamps, run deduplication test fixtures, then complete SS-013 acceptance.
6. Implement automated discovery, polling and publication under SS-020 (#28), not in this ticket.

## Additional official sources located (2026-11-11)
| Jurisdiction | Authority | URL | Coverage | Validation |
|---|---|---|---|---|
| US | OFAC | https://ofac.treasury.gov/recent-actions/enforcement-actions | Enforcement actions | Official public index located; HTTP audit pending |
| US | OFAC | https://ofac.treasury.gov/recent-actions/general-licenses | General licence issuance/amendments | Official public index located; HTTP audit pending |
| UK | OFSI | https://www.gov.uk/government/collections/enforcement-of-financial-sanctions | Published enforcement decisions | Official public index located; HTTP audit pending |
| UK | OFSI | https://www.gov.uk/government/collections/ofsi-general-licences | General licences | Official public index located; HTTP audit pending |

## Reachability audit implementation
`scripts/check_official_sources.py` checks HTTP availability with a 20-second timeout, logs HTTP status, redirects, errors and UTC check timestamps to a JSON report. `.github/workflows/ss-013-source-audit.yml` schedules it daily and supports manual execution; on the feature branch, scheduled execution will only become active once merged to the default branch. A reachable page is **not** evidence that an RSS/API endpoint exists or that content has been ingested. The workflow currently records failures without failing the job, so inspect its uploaded artifact rather than treating a green check as all sources reachable. No Lovable Cloud writes are made.

## Database registration and deduplication checks — 2026-11-11

- **Atlas (production cloud database):** eight stable official source indexes entered in `public.sanctions_sources` using code-key idempotent insert; `enabled=false` for each new source. The four pre-existing sanctions-list entries were not modified. The individual 2026-11-06 EU Commission news *article* was intentionally not registered in Atlas as a recurrent source.
- **Staging:** nine URL entries, including the EU example, registered disabled. Staging is intentionally not configured to ingest them.
- Atlas unique codes: no duplicate codes. Atlas normalized source URLs: no duplicates. `intelligence_candidates.source_url` has a unique constraint.
- Staging transactional/exception test: a second insert of the same candidate `source_url` raised `unique_violation` as expected, and test inserts were rolled back. This verifies **exact** URL duplication only.
- Atlas published records: one shared normalized source URL, `https://curia.europa.eu/juris/liste.jsf`, is used for **two distinct judgments**: Rosneft C-72/15 and Neves 77 Solutions C-351/22. They must **not** be merged. Use official document identity (jurisdiction, event category, case number / CELEX / authority identifier) before using URL as a fallback.
- Added `scripts/source_dedup.py` and `tests/test_source_dedup.py`. These are offline regression tests and do not yet wire identity generation into publication. That is part of subsequent ingestion work.
- Reachability HTTP checks are independent of content parsing and do not populate `last_checked_at` in the cloud database; no DB credentials are used by GitHub Actions.

## EU official source follow-up (2026-11-11)
- The recurring **EUR-Lex Official Journal** listing `https://eur-lex.europa.eu/oj/direct-access.html` replaced a one-off Commission news article in the GitHub source audit. The Official Journal L series includes regulations and decisions, but this broad listing is **not sanctions-filtered**.
- GitHub Actions run [#43060756919](https://github.com/toonvincke/sanctions-signal/actions/runs/43060756919) reported **HTTP 202** for this EUR-Lex page, rather than HTTP 200. This is not sufficient to assert that the page body, legal acts, or daily changes are consumable by our pipeline. The script now reports `content_ready` separately from basic HTTP responsiveness, while acknowledging HTTP 200 is also not a parsing test.
- EUR-Lex documents [predefined RSS alerts](https://eur-lex.europa.eu/content/help/search/predefined-rss.html) including Official Journal L, and [user-created RSS alerts](https://eur-lex.europa.eu/content/help/my-eurlex/my-rss-feeds.html?locale=en) for searches (signed-in registration required). No specific RSS endpoint has been validated yet; do not assume any guessed feed URL works.
- The [EUR-Lex SOAP search webservice](https://eur-lex.europa.eu/content/help/data-reuse/webservice.html?locale=en) is registration-based; the Cellar REST API serves document retrieval using identifiers. Neither integration is implemented by this PR.
- **Database:** the Atlas insert was requested earlier but no result was captured; as we are now working strictly without Lovable, its committed state remains **unverified**. Do not claim that this EU source is in the Atlas database until checked via a permitted non-Lovable database connection.
- Pending: choose and validate a real RSS/feed or data access path, test a real legal-act extraction and CELEX-based deduplication, then register/enroll an enabled EU monitoring source.

## EUR-Lex OJ L RSS candidate — 2026-11-11

The EUR-Lex [predefined RSS alerts help](https://eur-lex.europa.eu/content/help/search/predefined-rss.html) documents the "Acts of the Official Journal L" publication category. A third-party feed discovery service identifies the feed as `https://eur-lex.europa.eu/EN/display-feed.rss?rssId=222`. Unlike a static OJ landing page, this should yield one RSS item per published L-series act; **it is not sanctions-specific** and requires later metadata/classification filters.

The GitHub audit now requests this candidate feed and checks its actual RSS 2.0 XML document structure and channel title if the response is HTTP 200. A 202 or challenge page will be recorded as **not validated**. Feed status in the report must be inspected; an overall green workflow can otherwise mask missing coverage.

Known limitations:
- The original EUR-Lex OJ web index returned HTTP 202 from the GitHub-hosted runner; a feed response cannot be assumed to behave the same or differently until tested.
- RSS results are broad EU legislation; sanctions signals require identifying relevant legal acts by CELEX/document reference and content.
- RSS discovery/validation does not register a source in the Atlas database. No Lovable actions or DB writes were used for this follow-up.

## Live EUR-Lex RSS verification — 2026-11-11

GitHub Actions [run #43067783338](https://github.com/toonvincke/sanctions-signal/actions/runs/43067783338) confirms the OJ L RSS candidate `https://eur-lex.europa.eu/EN/display-feed.rss?rssId=222` answered **HTTP 200** and its response parsed as **RSS 2.0 XML** with a channel title. This is stronger evidence than an HTML index returning HTTP 202. We subsequently tightened the check to require at least one `item` with a `guid` or `link`; consult the latest PR Actions run for that check's result.

The feed is broad (all OJ L acts, not only sanctions). Source classification and extraction remain a separate implementation task. To register the RSS source *without enabling it*, an idempotent SQL statement has been prepared at `docs/sql/ss-013-register-eurlex-oj-l.sql`; it was **not executed**. Current Atlas EUR-Lex feed database status has not been verified through a non-Lovable connection.
