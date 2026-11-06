import { PROGRAMME_DETAILS } from "../src/lib/programme-detail";
import { safeOfficialUrl } from "./ss-024-link-check";

/**
 * Manually checked programme entry pages against the issuing authority's index
 * (6 Nov 2026). These are reference entry points, NOT legal opinions or current
 * consolidated texts. Avoid mapping omnibus or terminated regimes by guesswork.
 */
const verified: Record<string, [string, string, string]> = {
  // US: OFAC active programme index.
  "us|Cuba": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/cuba-sanctions","OFAC — Cuba sanctions","ofac_index"],
  "us|Iran": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions","OFAC — Iran sanctions","ofac_index"],
  "us|North Korea": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/north-korea-sanctions","OFAC — North Korea sanctions","ofac_index"],
  "us|Crimea and occupied regions of Ukraine": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/ukraine-russia-related-sanctions","OFAC — Ukraine/Russia sanctions (regional measures included)","ofac_index"],
  "us|Russia — harmful foreign activities": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/russian-harmful-foreign-activities-sanctions","OFAC — Russian harmful foreign activities","ofac_index"],
  "us|Ukraine-/Russia-related": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/ukraine-russia-related-sanctions","OFAC — Ukraine/Russia sanctions","ofac_index"],
  "us|Belarus": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/belarus-sanctions","OFAC — Belarus sanctions","ofac_index"],
  "us|Burma (Myanmar)": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/burma","OFAC — Burma-related sanctions","ofac_index"],
  "us|Venezuela": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/venezuela-related-sanctions","OFAC — Venezuela-related sanctions","ofac_index"],
  "us|Nicaragua": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/nicaragua-related-sanctions","OFAC — Nicaragua-related sanctions","ofac_index"],
  "us|Hong Kong-related": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/hong-kong-related-sanctions","OFAC — Hong Kong sanctions","ofac_index"],
  "us|Western Balkans": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/balkans-related-sanctions","OFAC — Balkans-related sanctions","ofac_index"],
  "us|Counter-terrorism": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/counter-terrorism-sanctions","OFAC — Counter terrorism","ofac_index"],
  "us|Global Magnitsky": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/global-magnitsky-sanctions","OFAC — Global Magnitsky","ofac_index"],
  "us|Cyber-related": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/sanctions-related-to-significant-malicious-cyber-enabled-activities","OFAC — Cyber-related sanctions","ofac_index"],
  "us|Non-proliferation": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/non-proliferation-sanctions","OFAC — Non-proliferation","ofac_index"],
  "us|Illicit drug trade": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/counter-narcotics-trafficking-sanctions","OFAC — Counter narcotics trafficking","ofac_index"],
  "us|Transnational criminal organisations": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/transnational-criminal-organizations","OFAC — Transnational criminal organizations","ofac_index"],
  "us|Chinese military-industrial complex": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/chinese-military-companies-sanctions","OFAC — Chinese military companies","ofac_index"],
  "us|CAATSA": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/countering-americas-adversaries-through-sanctions-act-related-sanctions","OFAC — CAATSA","ofac_index"],
  "us|International Criminal Court-related": ["https://ofac.treasury.gov/sanctions-programs-and-country-information/international-criminal-court-related-sanctions","OFAC — International Criminal Court","ofac_index"],

  // UK: direct statutory guidance links from GOV.UK's official current regime list.
  "uk|Russia": ["https://www.gov.uk/government/publications/russia-sanctions-guidance","UK — Russia sanctions guidance","govuk_regime_index"],
  "uk|Belarus": ["https://www.gov.uk/government/publications/republic-of-belarus-sanctions-guidance","UK — Belarus sanctions guidance","govuk_regime_index"],
  "uk|Iran": ["https://www.gov.uk/government/publications/iran-sanctions-guidance","UK — Iran sanctions guidance","govuk_regime_index"],
  "uk|Iran (nuclear)": ["https://www.gov.uk/government/publications/iran-nuclear-sanctions-guidance","UK — Iran nuclear guidance","govuk_regime_index"],
  "uk|DPRK": ["https://www.gov.uk/government/publications/democratic-peoples-republic-of-korea-sanctions-guidance","UK — DPRK sanctions guidance","govuk_regime_index"],
  "uk|Syria": ["https://www.gov.uk/government/publications/syria-sanctions-guidance","UK — Syria sanctions guidance","govuk_regime_index"],
  "uk|Myanmar": ["https://www.gov.uk/government/publications/myanmar-sanctions-guidance","UK — Myanmar sanctions guidance","govuk_regime_index"],
  "uk|Venezuela": ["https://www.gov.uk/government/publications/venezuela-sanctions-guidance","UK — Venezuela sanctions guidance","govuk_regime_index"],
  "uk|Global human rights": ["https://www.gov.uk/government/publications/global-human-rights-sanctions-guidance","UK — Global human rights guidance","govuk_regime_index"],
  "uk|Global anti-corruption": ["https://www.gov.uk/government/publications/global-anti-corruption-sanctions-guidance","UK — Global anti-corruption guidance","govuk_regime_index"],
  "uk|Global irregular migration and trafficking in persons": ["https://www.gov.uk/government/publications/global-irregular-migration-and-trafficking-in-persons-sanctions-guidance","UK — Irregular migration sanctions guidance","govuk_regime_index"],
  "uk|Cyber": ["https://www.gov.uk/government/publications/cyber-sanctions-guidance","UK — Cyber sanctions guidance","govuk_regime_index"],
  "uk|Chemical weapons": ["https://www.gov.uk/government/publications/chemical-weapons-sanctions-guidance","UK — Chemical weapons guidance","govuk_regime_index"],
  "uk|Counter-terrorism (international)": ["https://www.gov.uk/government/publications/counter-terrorism-international-sanctions-guidance","UK — International counter-terrorism guidance","govuk_regime_index"],
  "uk|ISIL (Da'esh) & Al-Qaida (UN)": ["https://www.gov.uk/government/publications/isil-daesh-and-al-qaida-sanctions-guidance","UK — ISIL and Al-Qaida guidance","govuk_regime_index"],

  // UN: official Security Council committees listed on main.un.org/securitycouncil/en/sanctions/information.
  "un|ISIL (Da'esh) & Al-Qaida": ["https://main.un.org/securitycouncil/en/sanctions/1267","UN — ISIL/Al-Qaida committee","un_committee_index"],
  "un|Taliban": ["https://main.un.org/securitycouncil/en/sanctions/1988","UN — Taliban sanctions committee","un_committee_index"],
  "un|Al-Shabaab": ["https://main.un.org/securitycouncil/sanctions/2713","UN — Al-Shabaab sanctions committee","un_committee_index"],
  "un|Democratic People's Republic of Korea": ["https://main.un.org/securitycouncil/en/sanctions/1718","UN — DPRK sanctions committee","un_committee_index"],
  "un|Iran": ["https://main.un.org/securitycouncil/en/sanctions/1737","UN — Iran sanctions committee","un_committee_index"],
  "un|Central African Republic": ["https://main.un.org/securitycouncil/sanctions/2745","UN — Central African Republic committee","un_committee_index"],
  "un|Democratic Republic of the Congo": ["https://main.un.org/securitycouncil/sanctions/1533","UN — DRC sanctions committee","un_committee_index"],
  "un|Guinea-Bissau": ["https://main.un.org/securitycouncil/sanctions/2048","UN — Guinea-Bissau sanctions committee","un_committee_index"],
  "un|Haiti": ["https://main.un.org/securitycouncil/sanctions/2653","UN — Haiti sanctions committee","un_committee_index"],
  "un|Iraq": ["https://main.un.org/securitycouncil/en/sanctions/1518","UN — Iraq sanctions committee","un_committee_index"],
  "un|Lebanon": ["https://main.un.org/securitycouncil/sanctions/1636","UN — Lebanon sanctions committee","un_committee_index"],
  "un|Libya": ["https://main.un.org/securitycouncil/sanctions/1970","UN — Libya sanctions committee","un_committee_index"],
  "un|South Sudan": ["https://main.un.org/securitycouncil/sanctions/2206","UN — South Sudan sanctions committee","un_committee_index"],
  "un|Sudan": ["https://main.un.org/securitycouncil/sanctions/1591","UN — Sudan sanctions committee","un_committee_index"],
  "un|Yemen": ["https://main.un.org/securitycouncil/en/sanctions/2140","UN — Yemen sanctions committee","un_committee_index"],
};

/** Stable EUR-Lex ELI permalink constructed only when the catalogue supplies
 * an explicit 'Reg. (EU/EC) number/year' or 'Reg. (EU) year/number' identifier.
 * Registry identifier/source match was checked against EUR-Lex document metadata.
 * This is a citation to the ORIGINAL act; it does not claim the latest consolidated legal status.
 */
function euBasisCandidate(basis?: string): string | null {
  if (!basis) return null;
  const match = basis.match(/Reg\.\s*\((?:EU|EC)\)(?:\s+No)?\s+(\d{1,4})\/(\d{4})/i) ??
    basis.match(/Reg\.\s*\((?:EU|EC)\)(?:\s+No)?\s+(\d{4})\/(\d{1,4})/i);
  if (!match) return null;
  const a = Number(match[1]), b = Number(match[2]);
  const year = a >= 1950 ? a : b;
  const number = a >= 1950 ? b : a;
  if (year < 1990 || year > 2027 || number < 1 || number > 9999) return null;
  return `https://eur-lex.europa.eu/eli/reg/${year}/${number}/oj/eng`;
}

const q = (v: string) => "'" + v.replaceAll("'", "''") + "'";
const catalogKeys = new Set(PROGRAMME_DETAILS.map(p => p.jurisdiction + "|" + p.programme.name));
const unknownKeys = Object.keys(verified).filter(key => !catalogKeys.has(key));
if (unknownKeys.length) throw new Error("Curated source key not in catalogue: " + unknownKeys.join(", "));
const selections = PROGRAMME_DETAILS.map(p => {
 const key = p.jurisdiction + "|" + p.programme.name;
 const found = verified[key];
 if (found) return {
  jurisdiction:p.jurisdiction,slug:p.slug,name:p.programme.name,
  url:found[0],label:found[1],provenance:found[2],status:"mapped" as const,
 };
 const candidate = p.jurisdiction === "eu" ? euBasisCandidate(p.programme.basis) : null;
 return {
  jurisdiction:p.jurisdiction,slug:p.slug,name:p.programme.name,
  url:candidate,label:candidate ? "EUR-Lex — original Council regulation (see amendments)" : null,
  provenance:candidate ? "eurlex_regulation_identifier" : null,
  status:candidate ? "mapped" as const : "needs_mapping" as const,
 };
});
for (const m of selections) if (m.url && !safeOfficialUrl(m.url)) throw new Error("Unsafe official URL: "+m.url);
if (new Set(selections.map(x=>x.jurisdiction+"/"+x.slug)).size !== selections.length) throw new Error("Duplicate programme key");
const counts = selections.reduce<Record<string,number>>((acc,m) => {
 acc[m.status]=(acc[m.status]??0)+1;
 return acc;
},{});
if (process.argv.includes("--json")) {
 process.stdout.write(JSON.stringify({total:selections.length,counts,programmes:selections},null,2)+"\n");
} else if (process.argv.includes("--sql")) {
 process.stdout.write("-- SS-024 curated verified entry points and separately-labelled unverified EU URL candidates.\n");
 process.stdout.write("-- No production write without explicit rollout; use a staging transaction first.\n");
 const rows=selections.filter(p=>p.url);
 process.stdout.write("WITH mappings (jurisdiction,slug,official_programme_url,official_programme_label,official_programme_source,source_mapping_status) AS (VALUES\n");
 process.stdout.write(rows.map(p=>" ("+[p.jurisdiction,p.slug,p.url!,p.label!,p.provenance!,p.status].map(q).join(",")+")").join(",\n")+"\n)\n");
 process.stdout.write("UPDATE public.sanctions_programmes p SET official_programme_url=m.official_programme_url, official_programme_label=m.official_programme_label, official_programme_source=m.official_programme_source, source_mapping_status=m.source_mapping_status, updated_at=now() FROM mappings m WHERE p.jurisdiction=m.jurisdiction AND p.slug=m.slug AND (p.official_programme_url IS NULL OR p.official_programme_url=m.official_programme_url) AND p.source_mapping_status IN ('needs_mapping','review_required','mapped');\n");
 process.stdout.write("SELECT jurisdiction,source_mapping_status,count(*)::int AS programmes FROM public.sanctions_programmes GROUP BY jurisdiction,source_mapping_status ORDER BY jurisdiction,source_mapping_status;\n");
} else {
 process.stdout.write("SS-024: "+selections.length+" programme pages. "+JSON.stringify(counts)+"\nUse --json or --sql.\n");
}
