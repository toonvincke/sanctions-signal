import unPhoto from "@/assets/photos/un-security-council-chamber.jpg.asset.json";
import euPhoto from "@/assets/photos/eu-flag-strasbourg.jpg.asset.json";
import ukPhoto from "@/assets/photos/uk-government-offices-whitehall.jpg.asset.json";
import usPhoto from "@/assets/photos/us-treasury-building.jpg.asset.json";
import intlPhoto from "@/assets/photos/palais-des-nations-flags.jpg.asset.json";
import heroPhoto from "@/assets/photos/un-geneva-alley-of-flags.jpg.asset.json";

/**
 * Static, public overview of sanctions programmes per issuing authority.
 * Programme lists change frequently; every page links to the official list.
 */

export type Photo = { url: string; alt: string; credit: string; creditUrl: string };

export const PHOTOS = {
  hero: {
    url: heroPhoto.url,
    alt: "Alley of national flags in front of the Palais des Nations, United Nations Office at Geneva",
    credit: "Alley of flags, Palais des Nations — Tinux, CC0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Alley_of_flags_UNO_Geneva.jpg",
  },
  un: {
    url: unPhoto.url,
    alt: "The United Nations Security Council chamber in New York",
    credit: "UN Security Council chamber — James D. Forrester, CC BY 4.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:United_Nations_Headquarters_-_Security_Council_chamber,_angled_view_(cropped).jpg",
  },
  eu: {
    url: euPhoto.url,
    alt: "European flag being raised in front of the European Parliament in Strasbourg",
    credit: "European flag ceremony, Strasbourg — European Parliament, CC BY 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Raising_ceremony_of_the_European_flag_for_the_beginning_of_the_10th_legislative_term_in_front_of_the_European_Parliament_in_Strasbourg_-_53866508976.jpg",
  },
  uk: {
    url: ukPhoto.url,
    alt: "Government Offices Great George Street in Whitehall, home of HM Treasury",
    credit: "Government Offices Great George Street — bryansjs, CC BY-SA 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Government_Offices_Great_George_Street,_2018.jpg",
  },
  us: {
    url: usPhoto.url,
    alt: "The U.S. Treasury Building in Washington, D.C., seen from above",
    credit: "U.S. Treasury Building — MeanieHyaena, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Us-treasury-building.jpg",
  },
  international: {
    url: intlPhoto.url,
    alt: "Rows of national flags at the Palais des Nations in Geneva",
    credit: "Palais des Nations flags — Benoît Prieur, CC0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Palace_of_Nations_-_flags.JPG",
  },
} satisfies Record<string, Photo>;

export type Program = { name: string; basis?: string; scope: string; note?: string };
export type Authority = { name: string; role: string };
export type SourceLink = { label: string; url: string };

export type RegimeOverview = {
  slug: "un" | "eu" | "us" | "uk";
  label: string;
  title: string;
  intro: string;
  photo: Photo;
  authorities: Authority[];
  sources: SourceLink[];
  groups: { heading: string; programs: Program[] }[];
};

export type CountryOverview = {
  name: string;
  code: string;
  approach: string;
  legalBasis: string[];
  authorities: Authority[];
  autonomous: string;
  sources: SourceLink[];
};

export const UN: RegimeOverview = {
  slug: "un",
  label: "UN sanctions",
  title: "United Nations Security Council sanctions",
  intro:
    "Measures adopted by the Security Council under Chapter VII of the UN Charter are binding on all 193 member states. Each regime is overseen by a sanctions committee and implemented domestically — in the EU by Council regulation, in the UK under SAMLA 2018, in the US by executive order.",
  photo: PHOTOS.un,
  authorities: [
    { name: "UN Security Council", role: "Adopts and renews sanctions resolutions" },
    { name: "Sanctions committees", role: "Designate individuals and entities, grant exemptions" },
    { name: "Panels of experts", role: "Monitor implementation and report violations" },
    { name: "Office of the Ombudsperson", role: "Delisting requests under the ISIL/Al-Qaida regime" },
  ],
  sources: [
    { label: "UN Security Council — sanctions information", url: "https://main.un.org/securitycouncil/en/sanctions/information" },
    { label: "UN Security Council Consolidated List", url: "https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list" },
  ],
  groups: [
    {
      heading: "Counter-terrorism",
      programs: [
        { name: "ISIL (Da'esh) & Al-Qaida", basis: "Res. 1267 (1999), 1989 (2011), 2253 (2015)", scope: "Asset freeze, travel ban, arms embargo" },
        { name: "Taliban", basis: "Res. 1988 (2011)", scope: "Asset freeze, travel ban, arms embargo" },
        { name: "Al-Shabaab", basis: "Res. 2713 (2023)", scope: "Asset freeze, travel ban, targeted arms embargo, charcoal ban" },
      ],
    },
    {
      heading: "Non-proliferation",
      programs: [
        {
          name: "Democratic People's Republic of Korea",
          basis: "Res. 1718 (2006) and successors",
          scope: "Arms and WMD embargo, sectoral trade bans, financial restrictions, maritime measures",
          note: "Panel of Experts mandate lapsed in April 2024.",
        },
        {
          name: "Iran",
          basis: "Res. 1737 (2006) and successors",
          scope: "Nuclear and ballistic-missile related restrictions, arms embargo, asset freeze",
          note: "Re-imposed through the Res. 2231 snapback procedure in September 2025; Russia and China dispute its validity.",
        },
      ],
    },
    {
      heading: "Country and conflict regimes",
      programs: [
        { name: "Central African Republic", basis: "Res. 2127 (2013)", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Democratic Republic of the Congo", basis: "Res. 1533 (2004)", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Guinea-Bissau", basis: "Res. 2048 (2012)", scope: "Travel ban" },
        { name: "Haiti", basis: "Res. 2653 (2022)", scope: "Asset freeze, travel ban, targeted arms embargo" },
        { name: "Iraq", basis: "Res. 1518 (2003)", scope: "Asset freeze (former regime funds)" },
        { name: "Lebanon", basis: "Res. 1636 (2005)", scope: "Asset freeze, travel ban", note: "No individuals currently listed." },
        { name: "Libya", basis: "Res. 1970 (2011)", scope: "Arms embargo, asset freeze, travel ban, illicit petroleum export measures" },
        { name: "South Sudan", basis: "Res. 2206 (2015)", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Sudan", basis: "Res. 1591 (2005)", scope: "Arms embargo (Darfur), asset freeze, travel ban" },
        { name: "Yemen", basis: "Res. 2140 (2014)", scope: "Asset freeze, travel ban, targeted arms embargo" },
      ],
    },
  ],
};

export const EU: RegimeOverview = {
  slug: "eu",
  label: "EU sanctions",
  title: "European Union restrictive measures",
  intro:
    "EU sanctions are adopted unanimously by the Council as a CFSP Decision and, where they touch economic activity, a directly applicable Council Regulation. They implement UN measures and add autonomous regimes. Enforcement and penalties are a matter for each member state.",
  photo: PHOTOS.eu,
  authorities: [
    { name: "Council of the EU", role: "Adopts Decisions and Regulations, listings and packages" },
    { name: "European Commission (DG FISMA)", role: "Guidance, FAQs, monitors uniform implementation" },
    { name: "EEAS / High Representative", role: "Proposes measures and listings" },
    { name: "National competent authorities", role: "Licensing, supervision and penalties in each member state" },
    { name: "CJEU / General Court", role: "Reviews legality of listings and measures" },
  ],
  sources: [
    { label: "EU Sanctions Map", url: "https://www.sanctionsmap.eu/" },
    { label: "Council of the EU — sanctions", url: "https://www.consilium.europa.eu/en/policies/sanctions-against-russia/" },
    { label: "Commission — financial sanctions files (FSF)", url: "https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures_en" },
  ],
  groups: [
    {
      heading: "Russia, Belarus and Ukraine",
      programs: [
        {
          name: "Russia — sectoral measures",
          basis: "Reg. (EU) No 833/2014",
          scope: "Trade, finance, energy, transport, services; anti-circumvention and best-efforts obligations",
        },
        { name: "Ukraine — territorial integrity (listings)", basis: "Reg. (EU) No 269/2014", scope: "Asset freeze, travel ban" },
        { name: "Crimea and Sevastopol", basis: "Reg. (EU) No 692/2014", scope: "Import, investment, services and tourism bans" },
        {
          name: "Non-government-controlled areas of Ukraine",
          basis: "Reg. (EU) 2022/263",
          scope: "Trade and investment restrictions — Donetsk, Luhansk, Kherson, Zaporizhzhia",
        },
        { name: "Russia — destabilising activities (hybrid threats)", basis: "Reg. (EU) 2024/2642", scope: "Asset freeze, travel ban" },
        { name: "Russia — human rights", scope: "Asset freeze, travel ban, export restrictions on repression equipment" },
        { name: "Misappropriation of Ukrainian state funds", basis: "Reg. (EU) No 208/2014", scope: "Asset freeze" },
        { name: "Belarus", basis: "Reg. (EC) No 765/2006", scope: "Sectoral trade and finance measures mirroring Russia, asset freeze" },
      ],
    },
    {
      heading: "Country regimes",
      programs: [
        { name: "Afghanistan", basis: "Reg. (EU) No 753/2011", scope: "UN Taliban listings: asset freeze, travel ban" },
        { name: "Bosnia and Herzegovina", scope: "Asset freeze, travel ban" },
        { name: "Central African Republic", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Democratic Republic of the Congo", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Guatemala", scope: "Asset freeze, travel ban" },
        { name: "Guinea", scope: "Asset freeze, travel ban" },
        { name: "Guinea-Bissau", scope: "Asset freeze, travel ban" },
        { name: "Haiti", scope: "Asset freeze, travel ban, targeted arms embargo" },
        { name: "Iran — nuclear proliferation", basis: "Reg. (EU) No 267/2012", scope: "Trade, finance, transport and asset freeze measures" },
        { name: "Iran — human rights", basis: "Reg. (EU) No 359/2011", scope: "Asset freeze, travel ban, telecom-monitoring equipment ban" },
        { name: "Iran — drones and missiles", basis: "Reg. (EU) 2023/1529", scope: "Export bans on UAV and missile components, asset freeze" },
        { name: "Iraq", basis: "Reg. (EC) No 1210/2003", scope: "Asset freeze, cultural property trade ban" },
        { name: "Lebanon", scope: "Asset freeze, travel ban" },
        { name: "Libya", basis: "Reg. (EU) 2016/44", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Mali", scope: "Asset freeze, travel ban" },
        { name: "Moldova", scope: "Asset freeze, travel ban (destabilisation)" },
        { name: "Myanmar (Burma)", basis: "Reg. (EU) No 401/2013", scope: "Arms embargo, dual-use export ban, asset freeze" },
        { name: "Nicaragua", scope: "Asset freeze, travel ban" },
        { name: "North Korea (DPRK)", basis: "Reg. (EU) 2017/1509", scope: "UN and autonomous trade, finance and asset freeze measures" },
        { name: "Somalia", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "South Sudan", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Sudan", scope: "Arms embargo, asset freeze, travel ban" },
        {
          name: "Syria",
          basis: "Reg. (EU) No 36/2012",
          scope: "Asset freeze, chemical-weapons and security-related measures",
          note: "Most economic measures lifted in May 2025.",
        },
        { name: "Tunisia", scope: "Asset freeze (misappropriation of state funds)" },
        { name: "Türkiye — unauthorised drilling", basis: "Reg. (EU) 2019/1890", scope: "Asset freeze, travel ban" },
        { name: "Venezuela", basis: "Reg. (EU) 2017/2063", scope: "Arms embargo, asset freeze, travel ban" },
        { name: "Yemen", scope: "Asset freeze, travel ban, targeted arms embargo" },
        { name: "Zimbabwe", scope: "Arms embargo" },
      ],
    },
    {
      heading: "Thematic (horizontal) regimes",
      programs: [
        { name: "Global human rights", basis: "Reg. (EU) 2020/1998", scope: "Asset freeze, travel ban" },
        { name: "Cyber-attacks", basis: "Reg. (EU) 2019/796", scope: "Asset freeze, travel ban" },
        { name: "Chemical weapons", basis: "Reg. (EU) 2018/1542", scope: "Asset freeze, travel ban" },
        { name: "Terrorism (CP 931 list)", basis: "Reg. (EC) No 2580/2001", scope: "Asset freeze" },
        { name: "ISIL (Da'esh) & Al-Qaida — UN listings", basis: "Reg. (EC) No 881/2002", scope: "Asset freeze" },
        { name: "ISIL (Da'esh) & Al-Qaida — autonomous", basis: "Reg. (EU) 2016/1686", scope: "Asset freeze, travel ban" },
        { name: "Hamas and Palestinian Islamic Jihad", basis: "Reg. (EU) 2024/386", scope: "Asset freeze, travel ban" },
      ],
    },
  ],
};

export const US: RegimeOverview = {
  slug: "us",
  label: "US sanctions",
  title: "United States sanctions programmes",
  intro:
    "US sanctions are mainly administered by the Treasury's Office of Foreign Assets Control (OFAC) under IEEPA, executive orders and programme-specific statutes. Many programmes carry secondary-sanctions risk for non-US persons, and export controls run in parallel at Commerce (BIS).",
  photo: PHOTOS.us,
  authorities: [
    { name: "OFAC (Treasury)", role: "SDN and other lists, licences, civil penalties" },
    { name: "BIS (Commerce)", role: "Export Administration Regulations, Entity List" },
    { name: "Department of State", role: "Secondary-sanctions designations, ITAR (DDTC)" },
    { name: "Department of Justice (NSD)", role: "Criminal prosecution of wilful violations" },
    { name: "FinCEN", role: "AML reporting and sanctions-evasion alerts" },
  ],
  sources: [
    { label: "OFAC — sanctions programs and country information", url: "https://ofac.treasury.gov/sanctions-programs-and-country-information" },
    { label: "OFAC Sanctions List Search", url: "https://sanctionssearch.ofac.treas.gov/" },
    { label: "BIS — Entity List", url: "https://www.bis.gov/entity-list" },
  ],
  groups: [
    {
      heading: "Comprehensive and near-comprehensive",
      programs: [
        { name: "Cuba", basis: "Cuban Assets Control Regulations, 31 CFR 515", scope: "Comprehensive embargo" },
        { name: "Iran", basis: "31 CFR 560 and multiple EOs", scope: "Comprehensive embargo, extensive secondary sanctions" },
        { name: "North Korea", basis: "31 CFR 510, EO 13722", scope: "Comprehensive embargo" },
        { name: "Crimea and occupied regions of Ukraine", basis: "EO 13685, EO 14065", scope: "Regional embargo" },
      ],
    },
    {
      heading: "Country-based list programmes",
      programs: [
        { name: "Russia — harmful foreign activities", basis: "EO 14024", scope: "SDN designations, sectoral determinations, secondary sanctions on foreign banks" },
        { name: "Ukraine-/Russia-related", basis: "EO 13660, 13661, 13662", scope: "SDN and Sectoral Sanctions Identifications (SSI)" },
        { name: "Belarus", basis: "EO 13405", scope: "SDN designations" },
        { name: "Burma (Myanmar)", basis: "EO 14014", scope: "SDN designations" },
        { name: "Venezuela", basis: "EO 13850, 13884", scope: "Government of Venezuela blocking, sectoral measures" },
        { name: "Nicaragua", basis: "EO 13851", scope: "SDN designations" },
        { name: "Hong Kong-related", basis: "EO 13936", scope: "SDN designations" },
        { name: "Western Balkans", basis: "EO 14033", scope: "SDN designations" },
        { name: "Syria", scope: "Programme terminated by EO 14312 (June 2025)", note: "Designations of Assad-linked and terrorist actors remain under other authorities." },
        { name: "Other country programmes", scope: "Afghanistan, Central African Republic, DRC, Iraq, Lebanon, Libya, Mali, Somalia, South Sudan, Sudan, Yemen" },
      ],
    },
    {
      heading: "Thematic programmes",
      programs: [
        { name: "Counter-terrorism", basis: "EO 13224", scope: "SDGT designations, secondary sanctions on foreign financial institutions" },
        { name: "Global Magnitsky", basis: "EO 13818", scope: "Human rights abuse and corruption" },
        { name: "Cyber-related", basis: "EO 13694", scope: "Malicious cyber activity, ransomware facilitators" },
        { name: "Non-proliferation", basis: "EO 13382", scope: "WMD proliferators and supporters" },
        { name: "Illicit drug trade", basis: "EO 14059; Kingpin Act", scope: "Narcotics traffickers, fentanyl supply chains" },
        { name: "Transnational criminal organisations", basis: "EO 13581", scope: "SDN designations" },
        { name: "Chinese military-industrial complex", basis: "EO 14032", scope: "Securities investment prohibition (NS-CMIC List)" },
        { name: "Foreign sanctions evaders", basis: "EO 13608", scope: "Persons evading Iran and Syria sanctions" },
        { name: "CAATSA", basis: "Countering America's Adversaries Through Sanctions Act (2017)", scope: "Statutory secondary sanctions — Russia, Iran, DPRK" },
        { name: "International Criminal Court-related", basis: "EO 14203", scope: "SDN designations" },
      ],
    },
  ],
};

export const UK: RegimeOverview = {
  slug: "uk",
  label: "UK sanctions",
  title: "United Kingdom sanctions regimes",
  intro:
    "Since leaving the EU, the UK runs its own sanctions under the Sanctions and Anti-Money Laundering Act 2018 (SAMLA). Each regime is a separate set of regulations; designations are made by ministers, and financial and trade sanctions are enforced by dedicated HM Treasury and Department for Business and Trade units.",
  photo: PHOTOS.uk,
  authorities: [
    { name: "FCDO", role: "Sanctions policy and most designations" },
    { name: "OFSI (HM Treasury)", role: "Financial sanctions licensing and civil penalties" },
    { name: "OTSI (Department for Business and Trade)", role: "Civil enforcement of trade sanctions" },
    { name: "HMRC", role: "Export-control and trade-sanctions criminal enforcement" },
    { name: "Department for Transport", role: "Shipping and aviation sanctions" },
    { name: "National Crime Agency", role: "Criminal investigation of serious breaches" },
  ],
  sources: [
    { label: "UK sanctions list (FCDO)", url: "https://www.gov.uk/government/publications/the-uk-sanctions-list" },
    { label: "UK sanctions regimes — gov.uk", url: "https://www.gov.uk/guidance/uk-sanctions" },
    { label: "OFSI — financial sanctions guidance", url: "https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation" },
  ],
  groups: [
    {
      heading: "Major country regimes",
      programs: [
        { name: "Russia", basis: "The Russia (Sanctions) (EU Exit) Regulations 2019", scope: "Asset freeze, trade, finance, shipping, aviation, professional services bans" },
        { name: "Belarus", basis: "The Republic of Belarus (Sanctions) (EU Exit) Regulations 2019", scope: "Asset freeze, trade and finance restrictions" },
        { name: "Iran", basis: "The Iran (Sanctions) Regulations 2023", scope: "Asset freeze, travel ban, drone and missile export controls" },
        { name: "Iran (nuclear)", basis: "The Iran (Sanctions) (Nuclear) (EU Exit) Regulations 2019", scope: "Proliferation-related trade and finance measures" },
        { name: "DPRK", basis: "The Democratic People's Republic of Korea (Sanctions) (EU Exit) Regulations 2019", scope: "UN and autonomous measures" },
        { name: "Syria", basis: "The Syria (Sanctions) (EU Exit) Regulations 2019", scope: "Asset freeze, chemical-weapons related measures", note: "Most trade and sectoral measures removed in 2025." },
        { name: "Myanmar", basis: "The Myanmar (Sanctions) Regulations 2021", scope: "Asset freeze, arms and dual-use restrictions" },
        { name: "Venezuela", basis: "The Venezuela (Sanctions) (EU Exit) Regulations 2019", scope: "Asset freeze, arms embargo" },
      ],
    },
    {
      heading: "Other country regimes",
      programs: [
        {
          name: "Country and conflict regimes",
          scope:
            "Afghanistan, Bosnia and Herzegovina, Central African Republic, DRC, Guinea, Guinea-Bissau, Haiti, Iraq, Lebanon, Libya, Mali, Nicaragua, Somalia, South Sudan, Sudan, Yemen, Zimbabwe",
        },
      ],
    },
    {
      heading: "Thematic regimes",
      programs: [
        { name: "Global human rights", basis: "The Global Human Rights Sanctions Regulations 2020", scope: "Asset freeze, travel ban" },
        { name: "Global anti-corruption", basis: "The Global Anti-Corruption Sanctions Regulations 2021", scope: "Asset freeze, travel ban" },
        { name: "Global irregular migration and trafficking in persons", basis: "The Global Irregular Migration and Trafficking in Persons Sanctions Regulations 2025", scope: "Asset freeze, travel ban" },
        { name: "Cyber", basis: "The Cyber (Sanctions) (EU Exit) Regulations 2020", scope: "Asset freeze, travel ban" },
        { name: "Chemical weapons", basis: "The Chemical Weapons (Sanctions) (EU Exit) Regulations 2019", scope: "Asset freeze, travel ban" },
        { name: "Counter-terrorism (international)", basis: "The Counter-Terrorism (International Sanctions) (EU Exit) Regulations 2019", scope: "Asset freeze" },
        { name: "ISIL (Da'esh) & Al-Qaida (UN)", basis: "The ISIL (Da'esh) and Al-Qaida (United Nations Sanctions) (EU Exit) Regulations 2019", scope: "Asset freeze, travel ban, arms embargo" },
        { name: "Domestic counter-terrorism", basis: "Terrorist Asset-Freezing etc. Act 2010", scope: "Asset freeze" },
      ],
    },
  ],
};

export const REGIMES = { un: UN, eu: EU, us: US, uk: UK } as const;
export type RegimeSlug = keyof typeof REGIMES;

export const INTERNATIONAL = {
  label: "International sanctions",
  title: "National sanctions frameworks",
  intro:
    "Beyond the UN, EU, UK and US, national governments implement sanctions through their own statutes — and some run autonomous lists or counter-sanctions. EU member states apply EU regulations directly but set their own penalties, competent authorities and, in some cases, national terrorist or human-rights lists.",
  photo: PHOTOS.international,
};

export const COUNTRIES: { region: string; countries: CountryOverview[] }[] = [
  {
    region: "EU member states",
    countries: [
      {
        name: "France",
        code: "FR",
        approach: "Implements UN and EU measures; national asset-freeze powers.",
        legalBasis: ["Code monétaire et financier, Art. L.562-2 et seq.", "Code des douanes (customs offences)"],
        authorities: [
          { name: "Direction générale du Trésor", role: "Asset freezes, licences, national register of freezes" },
          { name: "Direction générale des douanes (DGDDI)", role: "Trade sanctions and customs enforcement" },
          { name: "ACPR", role: "Supervision of banks and insurers" },
        ],
        autonomous: "National asset freezes (notably terrorism-related) under the Monetary and Financial Code.",
        sources: [{ label: "Registre national des gels — DG Trésor", url: "https://gels-avoirs.dgtresor.gouv.fr/" }],
      },
      {
        name: "Netherlands",
        code: "NL",
        approach: "Implements UN and EU measures; national terrorism list.",
        legalBasis: ["Sanctiewet 1977 (Sanctions Act)", "Sanctieregeling terrorisme 2007-II", "Wet op de economische delicten (criminal penalties)"],
        authorities: [
          { name: "Ministry of Foreign Affairs", role: "Sanctions policy and national listings" },
          { name: "De Nederlandsche Bank / AFM", role: "Supervision of financial institutions" },
          { name: "Douane / FIOD / Public Prosecution Service", role: "Investigation and prosecution" },
        ],
        autonomous: "National terrorism list (Nationale terrorismelijst). A modernised Sanctions Act is in the legislative process.",
        sources: [{ label: "Government of the Netherlands — sanctions", url: "https://www.government.nl/topics/international-sanctions" }],
      },
      {
        name: "Germany",
        code: "DE",
        approach: "Implements UN and EU measures; strong criminal enforcement.",
        legalBasis: ["Außenwirtschaftsgesetz (AWG)", "Außenwirtschaftsverordnung (AWV)", "Sanktionsdurchsetzungsgesetz I & II (2022)"],
        authorities: [
          { name: "Deutsche Bundesbank", role: "Financial sanctions, licences" },
          { name: "BAFA", role: "Export controls and trade-sanctions licences" },
          { name: "Zentralstelle für Sanktionsdurchsetzung (ZfS)", role: "Tracing and securing sanctioned assets" },
          { name: "Zoll / public prosecutors", role: "Criminal investigation under §§ 17–18 AWG" },
        ],
        autonomous: "No autonomous listing regime; breaches of EU sanctions are criminal offences under the AWG.",
        sources: [{ label: "Bundesbank — financial sanctions", url: "https://www.bundesbank.de/en/service/financial-sanctions" }],
      },
      {
        name: "Italy",
        code: "IT",
        approach: "Implements UN and EU measures through the Financial Security Committee.",
        legalBasis: ["Legislative Decree No. 109/2007 (asset freezing)", "Legislative Decree No. 221/2017 (export controls)"],
        authorities: [
          { name: "Comitato di Sicurezza Finanziaria (MEF)", role: "Coordinates freezes and exemptions" },
          { name: "UIF (Banca d'Italia)", role: "Financial intelligence, reporting" },
          { name: "UAMA (Foreign Ministry)", role: "Dual-use and trade-sanctions authorisations" },
          { name: "Guardia di Finanza", role: "Investigation and asset seizure" },
        ],
        autonomous: "National freezing powers for terrorism financing under Decree 109/2007.",
        sources: [{ label: "MEF — Comitato di Sicurezza Finanziaria", url: "https://www.dt.mef.gov.it/it/attivita_istituzionali/prevenzione_reati_finanziari/comitato_sicurezza_finanziaria/" }],
      },
      {
        name: "Czech Republic",
        code: "CZ",
        approach: "Implements UN and EU measures and runs its own national sanctions list.",
        legalBasis: ["Act No. 69/2006 Coll. on the implementation of international sanctions", "Act No. 1/2023 Coll. on restrictive measures (Czech 'Magnitsky' law)"],
        authorities: [
          { name: "Ministry of Foreign Affairs", role: "National sanctions list" },
          { name: "Financial Analytical Office (FAÚ)", role: "Financial sanctions supervision and enforcement" },
          { name: "Licensing Office (Ministry of Industry and Trade)", role: "Trade-related licences" },
        ],
        autonomous: "National sanctions list under Act 1/2023, used where EU-level listings cannot be agreed.",
        sources: [{ label: "Czech MFA — national sanctions list", url: "https://mzv.gov.cz/jnp/en/foreign_relations/sanctions_list/index.html" }],
      },
      {
        name: "Bulgaria",
        code: "BG",
        approach: "Implements UN and EU measures; national terrorism-financing list.",
        legalBasis: ["Law on Measures against the Financing of Terrorism", "Law on Measures against Money Laundering"],
        authorities: [
          { name: "State Agency for National Security (SANS) — FID", role: "Financial intelligence and freezing measures" },
          { name: "Ministry of Foreign Affairs", role: "Coordination of restrictive measures" },
          { name: "Customs Agency", role: "Trade-sanctions enforcement" },
        ],
        autonomous: "National list of persons subject to terrorism-financing measures adopted by the Council of Ministers.",
        sources: [{ label: "Bulgarian MFA — restrictive measures", url: "https://www.mfa.bg/en" }],
      },
      {
        name: "Hungary",
        code: "HU",
        approach: "Implements UN and EU measures; no autonomous regime.",
        legalBasis: ["Act LII of 2017 on the implementation of EU and UN financial and asset-related restrictive measures"],
        authorities: [
          { name: "Hungarian Financial Intelligence Unit (NAV)", role: "Asset freeze implementation" },
          { name: "Ministry of Foreign Affairs and Trade", role: "Sanctions policy" },
          { name: "Central Bank of Hungary (MNB)", role: "Supervision of financial institutions" },
        ],
        autonomous: "None. Hungary's position in Council unanimity votes on renewals is closely watched.",
        sources: [{ label: "NAV — Hungarian FIU", url: "https://nav.gov.hu/en" }],
      },
      {
        name: "Slovakia",
        code: "SK",
        approach: "Implements UN and EU measures; no autonomous regime.",
        legalBasis: ["Act No. 289/2016 Coll. on the implementation of international sanctions"],
        authorities: [
          { name: "Ministry of Foreign and European Affairs", role: "Coordination and notifications" },
          { name: "Financial Intelligence Unit (FSJ)", role: "Financial sanctions supervision" },
          { name: "Ministry of Economy", role: "Trade-sanctions licences" },
        ],
        autonomous: "None. Penalties and procedures set by Act 289/2016.",
        sources: [{ label: "Slovak MFEA — international sanctions", url: "https://www.mzv.sk/en/web/en" }],
      },
    ],
  },
  {
    region: "Asia",
    countries: [
      {
        name: "Hong Kong SAR",
        code: "HK",
        approach: "Implements UN Security Council sanctions only; does not implement unilateral measures.",
        legalBasis: ["United Nations Sanctions Ordinance (Cap. 537)", "United Nations (Anti-Terrorism Measures) Ordinance (Cap. 575)"],
        authorities: [
          { name: "Commerce and Economic Development Bureau", role: "UN sanctions regulations" },
          { name: "HKMA / SFC / Insurance Authority", role: "Sector supervision and screening expectations" },
          { name: "Customs and Excise Department", role: "Trade enforcement" },
        ],
        autonomous: "None. Firms with US, EU or UK nexus still face those regimes' exposure.",
        sources: [{ label: "Hong Kong CEDB — UN sanctions", url: "https://www.cedb.gov.hk/en/policies/united-nations-security-council-sanctions.html" }],
      },
      {
        name: "Singapore",
        code: "SG",
        approach: "Implements UN measures; adopted autonomous Russia measures in 2022.",
        legalBasis: ["United Nations Act 2001", "Terrorism (Suppression of Financing) Act 2002", "MAS sanctions regulations", "Strategic Goods (Control) Act"],
        authorities: [
          { name: "Monetary Authority of Singapore (MAS)", role: "Financial sanctions regulations for FIs" },
          { name: "Ministry of Foreign Affairs", role: "Sanctions policy" },
          { name: "Singapore Customs", role: "Export controls and trade enforcement" },
        ],
        autonomous: "Russia: export controls on military and dual-use items and financial measures against designated Russian banks (March 2022).",
        sources: [{ label: "MAS — targeted financial sanctions", url: "https://www.mas.gov.sg/regulation/anti-money-laundering/targeted-financial-sanctions" }],
      },
      {
        name: "China",
        code: "CN",
        approach: "Implements UN measures via MFA notices; operates counter-sanctions and blocking tools.",
        legalBasis: [
          "Anti-Foreign Sanctions Law (2021) and implementing regulations (2025)",
          "Unreliable Entity List Provisions (MOFCOM, 2020)",
          "Export Control Law (2020)",
          "Rules on Counteracting Unjustified Extra-territorial Application of Foreign Legislation (MOFCOM, 2021)",
        ],
        authorities: [
          { name: "Ministry of Foreign Affairs", role: "Countermeasures lists under the AFSL" },
          { name: "Ministry of Commerce (MOFCOM)", role: "Unreliable Entity List, export control list, blocking rules" },
        ],
        autonomous: "Counter-sanctions on foreign persons and companies; compliance with foreign sanctions may itself create liability in China.",
        sources: [{ label: "MOFCOM", url: "http://english.mofcom.gov.cn/" }],
      },
    ],
  },
];

export const ENFORCEMENT_AUTHORITIES: { jurisdiction: string; authority: string; powers: string; outcomes: string }[] = [
  { jurisdiction: "US", authority: "OFAC", powers: "Civil penalties on a strict-liability basis", outcomes: "Settlements, penalty notices, findings of violation" },
  { jurisdiction: "US", authority: "BIS", powers: "Civil and administrative export-control penalties", outcomes: "Settlements, denial orders, Entity List additions" },
  { jurisdiction: "US", authority: "DOJ (NSD)", powers: "Criminal prosecution of wilful violations", outcomes: "Indictments, plea agreements, DPAs, convictions" },
  { jurisdiction: "UK", authority: "OFSI", powers: "Civil monetary penalties (strict liability since 2022)", outcomes: "Penalty notices, disclosures, warning letters" },
  { jurisdiction: "UK", authority: "OTSI", powers: "Civil enforcement of trade sanctions", outcomes: "Civil penalties, compliance notices" },
  { jurisdiction: "UK", authority: "HMRC", powers: "Criminal and compound settlements for export breaches", outcomes: "Compound penalties, prosecutions" },
  { jurisdiction: "EU", authority: "Member-state authorities", powers: "National penalties; harmonised criminal offences under Directive (EU) 2024/1226", outcomes: "Administrative fines, criminal convictions, confiscation" },
];

export const TYPOLOGIES = [
  "Trans-shipment through third countries (Central Asia, Caucasus, Türkiye, UAE)",
  "Front companies and nominee directors",
  "Ownership and control structures below the 50% threshold",
  "Shadow-fleet tankers and ship-to-ship transfers",
  "Mis-description of HS codes and dual-use goods",
  "Correspondent banking and nested accounts",
  "Virtual-asset and crypto-exchange exposure",
];
