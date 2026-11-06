# SS-025 — Gecontroleerde uitrol (6 november 2026)

## Status
- **Database migraties 0008–0011 toegepast** op Lovable Cloud PostgreSQL van Sanctions Signal Atlas.
- **Drizzle-migratiegeschiedenis afgestemd**: 12 regels met SHA-256-hashes overeenkomstig `drizzle/migrations/meta/_journal.json` (regels 9–12 registreren 0008–0011).
- **PR #37 gemerged** naar GitHub `main`, commit `35ed776b23704d163f09805113a011c0799b177b`.
- Lovable werkte op branch `fix/ss-021-nested-programme-rendering`; merge-commit `9964b5652d270b97f738a719aaf6c20f6b1a8b2f` integreert main zonder force push of verlies van Lovable-config.
- **PR #39 gemerged** naar main, zodat Lovable's aanvullende type/route-verbeteringen ook in de canonieke branch zitten.
- De gewijzigde `assistant` Edge Function is volgens Lovable succesvol gedeployed; twee anonieme requests zijn met HTTP 401 geweigerd.
- Project is **niet gepubliceerd**. Premium checkout en betalingen zijn **niet geactiveerd**.

## Terugval en back-up
- Via de verbonden Lovable-tools kon de actuele volledige databaseback-up **niet direct worden ingezien**. Eerder bevestigde gebruiker een back-up van **5 november 2026 om 01:07:33 UTC**; controleer handmatig op een recentere snapshot via Lovable Cloud Backups voordat verdere risicovolle mutaties plaatsvinden.
- Voor migraties zijn huidige autorisatieregels vastgelegd in private tabellen:
  `private.ss025_pre_rollout_policies` (24 regels) en
  `private.ss025_pre_rollout_grants` (122 regels). **Deze tabellen zijn geen volledige herstelbare databaseback-up.**
- Alle vier migraties zijn vóór definitieve toepassing met succes in één rollbacktransactie op de echte database getest.

## Verificatie
- Oorspronkelijke 13 intelligence-records behouden, waarvan 10 goedgekeurd en 3 concept.
- 10 goedgekeurde, veilige headline-only rows in `intelligence_previews`.
- Simulatie met authentieke PostgreSQL-rollen en `auth.uid()`-claims in ROLLBACK-transacties:
  - anoniem: 10 publieke previews;
  - gratis ingelogd: 0 volledige artikelen, 10 previews;
  - actief Premium: 10 goedgekeurde volledige artikelen;
  - verlopen Premium: 0 volledige artikelen;
  - administrator: alle 13 records inclusief drafts.
- Onderliggende `TRUNCATE`-rechten voor browserrollen ingetrokken en gebruiker kan `user_subscriptions` niet muteren.
- GitHub frontend/CI checks groen voor PR #37 en #39.
- Lovable agent rapporteerde 18/18 projecttests geslaagd na route-tree regeneratie.
- Anonieme request naar vernieuwde AI Edge Function: HTTP 401, ook met alleen public app key.

## Nog te doen voordat betaaldabonnementen worden verkocht
- Gebruik een echte testaccount/JWT om HTTP Data API, browserroutes, dashboard, abonnementsstatus en Edge Function te testen; SQL-rollensimulatie is niet gelijk aan een browser-end-to-endtest.
- Test `assistant` ook expliciet voor actieve Premium-, gratis en administrator-gebruikers.
- Controleer de concrete Lovable Preview UX van programma-detailpagina's en de prijzen in de browser.
- Verifieer een **actuele** volledig herstelbare Lovable Cloud-back-up.
- Activeer de checkout pas na aparte Stripe/webhook-implementatie, facturatie en verdere beveiligingstests.
- SS-025 (#36) en SS-012 (#18) blijven open zolang die vervolgstappen niet zijn afgerond.
