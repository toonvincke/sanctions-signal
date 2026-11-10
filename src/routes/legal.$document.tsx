import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";

type Section = { heading: string; paragraphs: string[] };
type Document = { title: string; sections: Section[] };
const operator = "[LEGAL ENTITY NAME — COMPLETE BEFORE PUBLICATION]";
const email = "[PRIVACY / SUPPORT EMAIL — COMPLETE BEFORE PUBLICATION]";
const documents: Record<string, Document> = {
  "legal-notice": { title: "Legal Notice", sections: [
    { heading: "Service provider", paragraphs: [`This website is operated by ${operator}. Registered office: [REGISTERED ADDRESS]. Belgian enterprise number: [NUMBER]. VAT number: [VAT NUMBER, IF APPLICABLE]. Contact: ${email}.`, "These details must be verified and completed before the website is offered commercially."] },
    { heading: "Service and supervisory information", paragraphs: ["Sanctione Compass provides sanctions-related news, research and subscription-based information services. Where a regulated professional activity is offered, any applicable authorisation and supervisory details must be disclosed here."] },
    { heading: "Contact", paragraphs: [`For service or legal enquiries, contact ${email}. This notice does not replace the privacy notice or contractual terms.`] },
  ] },
  privacy: { title: "Privacy Policy", sections: [
    { heading: "Controller and scope", paragraphs: [`The controller is ${operator}, contactable at ${email}. This notice covers website visitors, account holders, subscribers and newsletter recipients.`] },
    { heading: "Data and purposes", paragraphs: ["We may process account identifiers, email addresses, authentication and account status, subscription and transaction references, support messages, newsletter preferences, and technical security logs. Payment card details are ordinarily handled by the payment processor, not stored directly by us; verify the actual integration before publication.", "We process account and subscription data to provide the contracted service (GDPR Article 6(1)(b)); invoices and mandatory records to comply with legal obligations (Article 6(1)(c)); security and fraud prevention where justified by legitimate interests (Article 6(1)(f)); and optional marketing or non-essential tracking on consent where required (Article 6(1)(a)). Legitimate interests require a documented balancing assessment."] },
    { heading: "Recipients and international transfers", paragraphs: ["Service providers may include hosting, authentication, email delivery, analytics and payment providers such as Stripe, depending on the deployed configuration. Identify all actual processors and sub-processors before publication.", "Where personal data is transferred outside the EEA, we rely on an applicable adequacy decision or appropriate safeguards such as standard contractual clauses, with supplementary measures where necessary. Verify transfers rather than assuming safeguards exist."] },
    { heading: "Retention", paragraphs: ["Account data is retained while needed to provide the service and for a justified period thereafter; statutory accounting records are retained for the legally required period. Newsletter details are retained until withdrawal, subject to limited suppression records. Security logs are kept only as long as necessary. A specific retention schedule must be adopted and reflected here before launch."] },
    { heading: "Your rights", paragraphs: [`Subject to GDPR conditions, you may request access, rectification, erasure, restriction, portability, object to processing and withdraw consent without affecting prior lawful processing. Contact ${email}. You may complain to the Belgian Data Protection Authority (www.dataprotectionauthority.be) or another competent supervisory authority.`] },
    { heading: "Security and updates", paragraphs: ["We apply appropriate organisational and technical safeguards. No system can be guaranteed risk-free. Material changes to this notice will be communicated as legally required."] },
  ] },
  cookies: { title: "Cookie Policy", sections: [
    { heading: "Cookies and similar technologies", paragraphs: ["The service may use strictly necessary session, authentication and security storage to keep accounts functional. Such storage generally does not require prior cookie consent, but transparency remains required."] },
    { heading: "Optional technologies", paragraphs: ["Analytics, advertising, embedded third-party content or other non-essential trackers must not be activated before valid consent where required by Belgian rules. Consent must be freely given, granular, revocable and as easy to refuse as to accept.", "A verified cookie inventory specifying each technology, provider, purpose and lifespan must be inserted before publication. Do not infer that the absence of a banner proves there are no trackers."] },
    { heading: "Managing preferences", paragraphs: ["Where non-essential technologies are deployed, a functioning consent-management interface with accept, reject and later withdrawal controls must be implemented. This page alone does not provide or record consent. Browser settings may also limit storage."] },
  ] },
  terms: { title: "Terms & Conditions", sections: [
    { heading: "Provider and acceptance", paragraphs: [`These terms govern access to the Sanctione Compass information platform provided by ${operator}. Contact: ${email}. The terms and material pre-contract information must be available before a paid order is placed.`] },
    { heading: "The service", paragraphs: ["We provide source-linked sanctions news, legal developments, enforcement information and editorial analysis. Free and Premium features are described on the pricing and product pages. We may correct errors and make reasonable service changes, subject to mandatory consumer rights."] },
    { heading: "Accounts and permitted use", paragraphs: ["You must provide accurate account details and protect your credentials. Access is personal to the authorised account or licensed organisation. Unauthorised bulk extraction, redistribution, account sharing and attempts to bypass access controls are prohibited to the extent permitted by applicable law."] },
    { heading: "Prices and subscriptions", paragraphs: ["The checkout must show the applicable total price, taxes, billing interval, automatic renewal, payment obligation and cancellation conditions before purchase. The final displayed checkout price governs the order. Paid access starts in accordance with the order confirmation and applicable withdrawal rights.", "Subscription changes, cancellation, refunds and statutory withdrawal rights are explained in the Subscriptions & Cancellation page, which forms part of these terms."] },
    { heading: "Availability and content", paragraphs: ["We aim to provide a reliable service but do not promise uninterrupted access or that editorial material will always be exhaustive or current. Nothing in these terms excludes mandatory conformity remedies or statutory rights for digital services."] },
    { heading: "Intellectual property", paragraphs: ["Original editorial content, website design and software are protected by applicable intellectual property rights. Public legal texts and third-party materials remain subject to their own legal status and rights. A subscription does not transfer ownership."] },
    { heading: "Liability and applicable law", paragraphs: ["Information is not tailored legal advice; users should check primary sources. Nothing excludes liability that cannot lawfully be excluded, including mandatory consumer remedies. Belgian law applies subject to mandatory protections available to consumers in their country of habitual residence. Disputes may be brought before courts competent under applicable EU and national rules."] },
    { heading: "Changes and contact", paragraphs: [`We will communicate material contractual changes as required by law. Contact ${email} for support, complaints or contractual questions.`] },
  ] },
  subscriptions: { title: "Subscriptions, Cancellation & Withdrawal", sections: [
    { heading: "Billing and renewal", paragraphs: ["Available plans, total prices including applicable taxes, billing periods and renewal terms must be shown clearly at checkout. Premium subscriptions renew automatically only on the disclosed terms. Stripe or another processor may administer payments; the seller remains responsible for consumer information obligations."] },
    { heading: "Cancellation", paragraphs: [`You may request cancellation through the account billing controls, where available, or by contacting ${email}. The effective date, remaining access and any refund entitlement depend on the disclosed plan and mandatory law. Cancellation must not be made unreasonably difficult.`] },
    { heading: "14-day consumer withdrawal right", paragraphs: ["Where EU consumer distance-selling law applies, consumers generally have 14 days from contract conclusion to withdraw from a service contract without giving a reason. Exceptions and consequences depend on whether the supply is legally a service or digital content and on the required express requests, acknowledgements and confirmations.", "Do not assume that immediate Premium access extinguishes withdrawal rights. The checkout must implement any necessary express consent and acknowledgement separately, and send the legally required confirmation. Where withdrawal applies, consumers can notify us with an unequivocal statement, including the model form below. Any lawful proportionate charge for services started at the consumer's express request must be assessed case by case."] },
    { heading: "Model withdrawal statement", paragraphs: [`To: ${operator}, ${email}. I hereby give notice that I withdraw from my contract for the following subscription: [PLAN]. Ordered on: [DATE]. Consumer name: [NAME]. Address: [ADDRESS]. Date: [DATE].`] },
    { heading: "Refunds and statutory remedies", paragraphs: ["Any refunds due under applicable law will be processed using the legally required method and timeframe. This policy does not restrict consumer rights relating to non-conforming digital services."] },
  ] },
  disclaimer: { title: "Editorial & Legal Disclaimer", sections: [
    { heading: "Information, not legal advice", paragraphs: ["Sanctione Compass provides general sanctions intelligence, summaries and research. It does not provide advice tailored to any specific person, transaction, jurisdiction or set of facts and does not create a lawyer-client relationship."] },
    { heading: "Verify official sources", paragraphs: ["Sanctions measures, licences, guidance, listings and court decisions can change without notice. Editorial updates may be incomplete or delayed. Verify the current official text, effective dates, amendments, competent authority guidance and applicable facts before acting."] },
    { heading: "No endorsement or guaranteed outcome", paragraphs: ["References to OFAC, EU institutions, UN bodies, UK authorities and other public organisations do not imply endorsement or affiliation. Any analysis is editorial judgment, not an official interpretation or a guarantee of regulatory compliance."] },
    { heading: "Legal rights preserved", paragraphs: ["Nothing here limits non-excludable liability, statutory consumer rights or obligations imposed by applicable law. See the Terms & Conditions for contractual provisions."] },
  ] },
};

function LegalPage() {
  const { document } = Route.useParams();
  const item = documents[document];
  if (!item) return <SiteLayout><div className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl">Document not found</h1><Link to="/" className="underline">Home</Link></div></SiteLayout>;
  return <SiteLayout><article className="mx-auto max-w-3xl px-6 py-14">
    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Legal information · Draft for verification</p>
    <h1 className="mt-3 font-serif text-4xl">{item.title}</h1>
    <p className="mt-3 text-sm text-muted-foreground">Last revised: 10 November 2026. This draft requires verification of the operator, vendors and live checkout before public launch.</p>
    {item.sections.map(section => <section key={section.heading} className="mt-9">
      <h2 className="font-serif text-2xl">{section.heading}</h2>
      {section.paragraphs.map((p,i) => <p key={i} className="mt-3 leading-7 text-muted-foreground">{p}</p>)}
    </section>)}
  </article></SiteLayout>;
}
export const Route = createFileRoute("/legal/$document")({ component: LegalPage });
