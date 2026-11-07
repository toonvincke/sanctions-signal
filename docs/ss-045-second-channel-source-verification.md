# SS-045 — Second-channel verification of previously inconclusive official URLs

Date: 2026-11-07. Source: Staging `sanctions_programmes` read-only query; independent web retrieval of issuing authority sites.

## Scope and interpretation
The first staging HTTP checker tested 97 mapped entries (96 unique URLs) and returned 59 HTTP 200, 15 UN HTTP 202, and 22 unique OFAC URLs with no response. Those 37 URLs are *inconclusive in the staging network*, not proven broken.

Second channel verified all 22 unique OFAC URLs by successfully retrieving exact primary OFAC pages in an external browsing environment, including Syria's 2025 termination announcement and the additional lists directory. OFAC active-programme index: https://ofac.treasury.gov/sanctions-programs-and-country-information .

For the 15 UN catalogue URLs: **6 original URLs** returned readable pages in the external browsing channel. The other **9 original URLs** did not yield a readable fetch in that channel, but the UN Security Council's own sanctions index explicitly links to all nine original URLs: https://main.un.org/securitycouncil/en/sanctions/information . Several alternate `/en/sanctions/NNNN` pages can be retrieved and are published by the same authority. **An official index link is proof of official publication of the reference, not a successful current HTTP fetch of the original URL**.

| Authority | Programme entry | Exact database URL | Second-channel evidence |
|---|---|---|---|
| UN | Al-Shabaab | [Primary](https://main.un.org/securitycouncil/sanctions/2713) | UN official index listed; original fetch inconclusive |
| UN | Central African Republic | [Primary](https://main.un.org/securitycouncil/sanctions/2745) | UN official index listed; original fetch inconclusive |
| UN | Democratic People's Republic of Korea | [Primary](https://main.un.org/securitycouncil/en/sanctions/1718) | UN URL direct retrieved |
| UN | Democratic Republic of the Congo | [Primary](https://main.un.org/securitycouncil/sanctions/1533) | UN official index listed; original fetch inconclusive |
| UN | Guinea-Bissau | [Primary](https://main.un.org/securitycouncil/sanctions/2048) | UN official index listed; original fetch inconclusive |
| UN | Haiti | [Primary](https://main.un.org/securitycouncil/sanctions/2653) | UN official index listed; original fetch inconclusive |
| UN | Iran | [Primary](https://main.un.org/securitycouncil/en/sanctions/1737) | UN URL direct retrieved |
| UN | Iraq | [Primary](https://main.un.org/securitycouncil/en/sanctions/1518) | UN URL direct retrieved |
| UN | ISIL (Da'esh) & Al-Qaida | [Primary](https://main.un.org/securitycouncil/en/sanctions/1267) | UN URL direct retrieved |
| UN | Lebanon | [Primary](https://main.un.org/securitycouncil/sanctions/1636) | UN official index listed; original fetch inconclusive |
| UN | Libya | [Primary](https://main.un.org/securitycouncil/sanctions/1970) | UN official index listed; original fetch inconclusive |
| UN | South Sudan | [Primary](https://main.un.org/securitycouncil/sanctions/2206) | UN official index listed; original fetch inconclusive |
| UN | Sudan | [Primary](https://main.un.org/securitycouncil/sanctions/1591) | UN official index listed; original fetch inconclusive |
| UN | Taliban | [Primary](https://main.un.org/securitycouncil/en/sanctions/1988) | UN URL direct retrieved |
| UN | Yemen | [Primary](https://main.un.org/securitycouncil/en/sanctions/2140) | UN URL direct retrieved |
| US | Belarus | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/belarus-sanctions) | OFAC direct retrieved |
| US | Burma (Myanmar) | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/burma) | OFAC direct retrieved |
| US | CAATSA | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/countering-americas-adversaries-through-sanctions-act-related-sanctions) | OFAC direct retrieved |
| US | Chinese military-industrial complex | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/chinese-military-companies-sanctions) | OFAC direct retrieved |
| US | Counter-terrorism | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/counter-terrorism-sanctions) | OFAC direct retrieved |
| US | Crimea and occupied regions of Ukraine / Ukraine-/Russia-related | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/ukraine-russia-related-sanctions) | OFAC direct retrieved |
| US | Cuba | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/cuba-sanctions) | OFAC direct retrieved |
| US | Cyber-related | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/sanctions-related-to-significant-malicious-cyber-enabled-activities) | OFAC direct retrieved |
| US | Foreign sanctions evaders | [Primary](https://ofac.treasury.gov/other-ofac-sanctions-lists) | OFAC direct retrieved |
| US | Global Magnitsky | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/global-magnitsky-sanctions) | OFAC direct retrieved |
| US | Hong Kong-related | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/hong-kong-related-sanctions) | OFAC direct retrieved |
| US | Illicit drug trade | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/counter-narcotics-trafficking-sanctions) | OFAC direct retrieved |
| US | International Criminal Court-related | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/international-criminal-court-related-sanctions) | OFAC direct retrieved |
| US | Iran | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions) | OFAC direct retrieved |
| US | Nicaragua | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/nicaragua-related-sanctions) | OFAC direct retrieved |
| US | Non-proliferation | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/non-proliferation-sanctions) | OFAC direct retrieved |
| US | North Korea | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/north-korea-sanctions) | OFAC direct retrieved |
| US | Russia — harmful foreign activities | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/russian-harmful-foreign-activities-sanctions) | OFAC direct retrieved |
| US | Syria | [Primary](https://ofac.treasury.gov/recent-actions/20250630) | OFAC direct retrieved |
| US | Transnational criminal organisations | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/transnational-criminal-organizations) | OFAC direct retrieved |
| US | Venezuela | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/venezuela-related-sanctions) | OFAC direct retrieved |
| US | Western Balkans | [Primary](https://ofac.treasury.gov/sanctions-programs-and-country-information/balkans-related-sanctions) | OFAC direct retrieved |

## Aggregate findings
- **22/22 OFAC unique URLs**: exact official pages retrievable through alternate browsing channel.
- **6/15 UN URLs**: original exact URLs retrievable through alternate browsing channel.
- **9/15 UN URLs**: original exact URLs listed on the Security Council's official index but direct retrieval inconclusive; alternate language path or official index confirms the committee entry.
- **0 proven bad/404/410 URLs** in these checks. No conclusion on up-to-date consolidated legal measures; this is URL identity/retrieval research only.
- **No database status or source_last_checked_at writes**. Do not mark links `ok` in staging DB based only on indexed references.
- Total 96 unique URLs across catalogue: 59 initial staging HTTP 200, 28 additional exact URLs retrievable from second channel, 9 confirmed official index references but unresolved direct fetch. This is **not** equivalent to 96/96 passing automated link monitoring.

## Follow-up
- For 9 UN original links, repeat verified direct HTTP test with a normal browser/network; only adopt an `/en/sanctions/` canonical link if redirected/recognized officially, and update source mapping with curator review.
- Investigate network-specific OFAC response failures in the automated checker separately; do not disable health-checking or misclassify no-response as 'broken'.
- Keep public legal summaries separate from live source status; review legal currency periodically.
