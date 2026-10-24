import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Calculator from "@/components/Calculator";
import StateContent from "@/components/StateContent";
import { publishability } from "@/lib/calc";
import { loadState, loadStates } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { collectSources } from "@/lib/sources";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadStates().map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const s = loadState(state);
  if (!s) return {};
  const { publishable } = publishability(s);
  return {
    title: `${s.name} Vehicle Sales Tax, Title & Registration Fees`,
    description: `Estimate ${s.name} vehicle sales tax, title and registration fees, with official sources and the date each figure was last checked.`,
    // Pages whose core numbers are not verified stay out of search results.
    alternates: { canonical: `/vehicle/${s.slug}/` },
    robots: publishable ? undefined : { index: false, follow: false },
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const s = loadState(state);
  if (!s) notFound();
  const pub = publishability(s);
  const allSources = collectSources(s);
  const hasSecondary = allSources.some((x) => x.source.publisherType === "secondary");
  const stateOnly = allSources.every((x) => x.source.publisherType === "state-agency");
  const countyCount = s.counties?.fees.value
    ? Object.keys(s.counties.fees.value).length
    : s.localRates?.rates.value
      ? Object.keys(s.localRates.rates.value).length
      : 0;

  return (
    <>
      <Breadcrumbs items={[{ label: "Sumdock", href: "/" }, { label: "Vehicle", href: "/vehicle/" }, { label: s.name }]} />
      <header className="page-head">
        <h1>{s.name} vehicle sales tax, title and registration calculator</h1>
        <p className="lede">
          Estimate what you pay on top of the price. Every figure links to the {s.name} agency page it came from.
        </p>
        <ul className="badges">
          <li className="badge badge--accent">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Data reviewed {formatDate(s.lastReviewed)}
          </li>
          {hasSecondary ? (
            <li className="badge badge--warn">Includes secondary sources</li>
          ) : (
            <li className="badge">{stateOnly ? "Official state sources only" : "Official sources only"}</li>
          )}
          {countyCount > 0 && <li className="badge">{countyCount} counties</li>}
        </ul>
      </header>

      {!pub.publishable && (
        <div className="banner">
          <strong>This state is still being verified.</strong> We have not confirmed every core figure from an official source
          ({pub.reasons.join("; ")}). The totals below leave out anything unconfirmed.
        </div>
      )}

      <Calculator state={s} />

      <StateContent state={s} />
    </>
  );
}
