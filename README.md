# Sanctions Signal

Build Milestone 1 of the Sanctions Intelligence SaaS Platform according to the attached specification:

1. Application Foundation & Design:
- High-trust legal-tech interface inspired by Global Sanctions: clean typography, restrained colors, dense yet readable data tables, and clear information hierarchy.
- Public web pages: Landing page (value proposition, key personas), Features, Pricing, and Contact.
- Authenticated portal: Dashboard (recent developments, priority alerts), Intelligence Explorer (with faceted search across jurisdictions, regimes, authorities, categories), detail pages for all content types, and Bookmarks.

2. Database Schema (Lovable Cloud / PostgreSQL):
- Implement the core relational models for Intelligence Records (headline, executive summary, detailed analysis, publication/event/effective dates, jurisdiction, regime, authority, affected entities/sectors, legal provisions, case numbers, penalty amounts, circumvention methods, practical implications, source URL, verification status).
- Enforce clean relationships for regimes, jurisdictions, authorities, and categories.

3. Core Intelligence Content & Seed:
- Populate with realistic, authoritative sample intelligence records across:
  - Sanctions Developments (e.g., EU, US OFAC, UK OFSI)
  - Case Law & Judgments (e.g., CJEU, UK courts)
  - Enforcement Actions & Penalties (e.g., OFAC settlements with circumvention typologies)
  - Regulatory Guidance & Legislation
- Every record must link to authoritative sources and explicitly separate source facts from compliance implications.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/11cd0f68-3c90-4464-95f5-dc21b750a5e2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
