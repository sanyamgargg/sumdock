import { calculateLlc, DEFAULT_YEARS, llcPublishability } from "./llc-calc";
import { expandLlcTokens, generatedLlcFaq } from "./llc-content";
import type { LlcState } from "./llc-types";
import { formatDate, usdShort } from "./format";
import { abs, breadcrumbLd, openGraph } from "./seo";
import { site } from "./site";

/** Search and answer-engine helpers for the LLC pages. Every figure comes from the data file and calculateLlc(). */

export const llcPath = (s: LlcState) => `/llc/${s.slug}/`;

/** Title without the " | Sumdock" suffix, which the layout template adds. */
export const llcTitle = (s: LlcState) => `${s.name} LLC Cost: Formation and Yearly Fees`;

/** Formation and yearly cost in one sentence, or null when the state is not publishable. */
export function llcCostSentence(s: LlcState): string | null {
  if (!llcPublishability(s).publishable) return null;
  const r = calculateLlc(s, DEFAULT_YEARS);
  const parts = [`${usdShort(r.formationTotal)} to form`];
  if (r.yearlyTotal > 0) parts.push(`${usdShort(r.yearlyTotal)} each year`);
  if (r.biennialTotal > 0) parts.push(`${usdShort(r.biennialTotal)} every two years`);
  return `State fees for a ${s.name} LLC: ${parts.join(", ")}.`;
}

export function llcDescription(s: LlcState): string {
  const cost = llcCostSentence(s);
  return `${cost ? `${cost} ` : ""}What it costs to form and keep a ${s.name} LLC, with each fee linked to the official ${s.name} page and last checked ${formatDate(s.lastReviewed)}.`;
}

/** Full metadata for a state page. Spread into the object returned by generateMetadata. */
export function llcMetadata(s: LlcState) {
  const path = llcPath(s);
  const title = llcTitle(s);
  const description = llcDescription(s);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph(path, title, description),
    twitter: { card: "summary" as const, title, description },
    robots: llcPublishability(s).publishable ? undefined : { index: false, follow: false },
  };
}

/** Questions and answers as plain text: the written FAQ first, then the generated ones. */
export function llcFaqPairs(s: LlcState): { q: string; a: string }[] {
  const written = (s.content?.faq ?? []).map((f) => ({ q: expandLlcTokens(f.q, s), a: expandLlcTokens(f.text, s) }));
  return [...written, ...generatedLlcFaq(s).map((f) => ({ q: f.q, a: f.a }))];
}

/** State page graph: WebPage + BreadcrumbList + FAQPage (FAQPage only for publishable states). */
export function llcPageLd(s: LlcState): Record<string, unknown> {
  const path = llcPath(s);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": abs(path),
      url: abs(path),
      name: llcTitle(s),
      description: llcDescription(s),
      inLanguage: "en-US",
      dateModified: s.lastReviewed,
      isPartOf: { "@id": abs("/#website") },
      author: { "@type": "Person", name: site.author },
      breadcrumb: { "@id": abs(`${path}#breadcrumb`) },
    },
    { "@id": abs(`${path}#breadcrumb`), ...breadcrumbLd([{ name: site.name, path: "/" }, { name: "LLC costs", path: "/llc/" }, { name: s.name, path }]) },
  ];
  if (llcPublishability(s).publishable) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: llcFaqPairs(s).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
