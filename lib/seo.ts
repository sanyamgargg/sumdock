import { calculate, isUsable, publishability } from "./calc";
import { DEFAULT_INPUTS, expandTokens, generatedFaq } from "./content";
import { formatDate, usd } from "./format";
import { site } from "./site";
import type { StateData } from "./types";

/**
 * Search and answer-engine helpers. Pure functions: every figure comes from the state data file and
 * calculate(), so titles, descriptions and structured data cannot drift from the calculator.
 * Wire these into the pages (generateMetadata and a JSON-LD script tag); see SEO.md.
 */

export const abs = (path: string) => `${site.url}${path}`;

/** Title without the " | Sumdock" suffix, which the layout template adds. */
export function stateTitle(s: StateData): string {
  const rate = s.salesTax.stateRatePct;
  const base = `${s.name} Vehicle Sales Tax, Title & Registration Fees`;
  return rate.value !== null && isUsable(rate.status) && rate.value > 0 ? `${base} (${rate.value}% state rate)` : base;
}

/** Total for the default $30,000 example, or null when the state is not publishable. */
export function exampleTotal(s: StateData): number | null {
  if (!publishability(s).publishable) return null;
  return calculate(s, DEFAULT_INPUTS).total;
}

export function stateDescription(s: StateData): string {
  const total = exampleTotal(s);
  const rate = s.salesTax.stateRatePct;
  const rateText = rate.value !== null && isUsable(rate.status) ? `${rate.value}% ${s.salesTax.taxName ?? "state sales tax"}, ` : "";
  const ex = total === null ? "" : ` Example: a ${usd(DEFAULT_INPUTS.price)} vehicle comes to ${usd(total)} in taxes and fees.`;
  return `${s.name} vehicle costs: ${rateText}title and registration fees, each linked to the official ${s.name} page and last checked ${formatDate(s.lastReviewed)}.${ex}`;
}

/** One answer-first sentence for the top of a state page (also useful as the AI-citation snippet). */
export function answerSentence(s: StateData): string | null {
  const total = exampleTotal(s);
  if (total === null) return null;
  const r = calculate(s, DEFAULT_INPUTS);
  return `On a ${usd(DEFAULT_INPUTS.price)} gas vehicle with no trade-in, the ${s.name} estimate is ${usd(total)} in taxes and fees (${r.lines.map((l) => `${l.label.toLowerCase()} ${usd(l.amount)}`).join(", ")}).`;
}

export function openGraph(path: string, title: string, description: string) {
  return {
    title,
    description,
    url: abs(path),
    siteName: site.name,
    type: "website" as const,
    locale: "en_US",
  };
}

/** Full metadata for a state page. Spread into the object returned by generateMetadata. */
export function stateMetadata(s: StateData) {
  const path = `/vehicle/${s.slug}/`;
  const title = stateTitle(s);
  const description = stateDescription(s);
  const { publishable } = publishability(s);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph(path, title, description),
    twitter: { card: "summary" as const, title, description },
    robots: publishable ? undefined : { index: false, follow: false },
  };
}

type Json = Record<string, unknown>;

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

/** Questions and answers as plain text, from the written FAQ when present, else the generated one. */
export function faqPairs(s: StateData): { q: string; a: string }[] {
  const written = s.content?.faq ?? [];
  if (written.length > 0) return written.map((f) => ({ q: f.q, a: expandTokens(f.text, s) }));
  return generatedFaq(s).map((f) => ({ q: f.q, a: f.a }));
}

/** Site-wide graph: put on the home page. */
export function siteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": abs("/#website"), url: abs("/"), name: site.name, description: site.tagline, inLanguage: "en-US", publisher: { "@id": abs("/#org") } },
      { "@type": "Organization", "@id": abs("/#org"), name: site.name, url: abs("/"), founder: { "@type": "Person", name: site.author, jobTitle: site.authorRole } },
    ],
  };
}

/** State page graph: WebPage + BreadcrumbList + FAQPage (only for publishable states). */
export function statePageLd(s: StateData): Json {
  const path = `/vehicle/${s.slug}/`;
  const title = stateTitle(s);
  const graph: Json[] = [
    {
      "@type": "WebPage",
      "@id": abs(path),
      url: abs(path),
      name: title,
      description: stateDescription(s),
      inLanguage: "en-US",
      dateModified: s.lastReviewed,
      isPartOf: { "@id": abs("/#website") },
      author: { "@type": "Person", name: site.author },
      breadcrumb: { "@id": abs(`${path}#breadcrumb`) },
    },
    { "@id": abs(`${path}#breadcrumb`), ...breadcrumbLd([{ name: site.name, path: "/" }, { name: "Vehicle", path: "/vehicle/" }, { name: s.name, path }]) },
  ];
  const faq = faqPairs(s);
  if (publishability(s).publishable && faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/** Plain-text index for AI tools (served at /llms.txt). Lists only publishable states. */
export function llmsTxt(states: StateData[]): string {
  const live = states.filter((s) => publishability(s).publishable);
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.tagline} Each figure links to the government page it came from and shows the date it was last checked.`,
    "",
    "## Calculators",
    "",
    `- [Vehicle sales tax, title and registration](${abs("/vehicle/")}): state-by-state estimates for buying a vehicle.`,
    "",
    "## States",
    "",
    ...live.map((s) => `- [${s.name}](${abs(`/vehicle/${s.slug}/`)}): last reviewed ${formatDate(s.lastReviewed)}.`),
    "",
    "## About the data",
    "",
    `- [Methodology](${abs("/methodology/")}): how sources are chosen and checked.`,
    `- [Changelog](${abs("/changelog/")}): changes to state numbers and rules.`,
    `- [About](${abs("/about/")}): who runs the site.`,
    "",
  ];
  return lines.join("\n");
}

/** Metadata for a static page: unique title and description, canonical and social tags. */
export function pageMetadata(path: string, title: string, description: string) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph(path, title, description),
    twitter: { card: "summary" as const, title, description },
  };
}
