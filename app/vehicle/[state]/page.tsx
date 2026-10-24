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
  const officialOnly = allSources.every((x) => x.source.publisherType !== "secondary");
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
          Estimate the sales tax, title and registration fees for a vehicle in {s.name}. Every figure links to the page it came from.
        </p>
        <ul className="badges">
          <li className="badge badge--accent">Data reviewed {formatDate(s.lastReviewed)}</li>
          {officialOnly ? (
            <li className="badge badge--accent">Official sources only</li>
          ) : (
            <li className="badge badge--warn">Includes secondary sources</li>
          )}
          {countyCount > 0 && <li className="badge badge--accent">{countyCount} counties covered</li>}
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
