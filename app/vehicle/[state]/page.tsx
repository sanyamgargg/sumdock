import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Calculator from "@/components/Calculator";
import StateContent from "@/components/StateContent";
import WhatChanged from "@/components/WhatChanged";
import { publishability } from "@/lib/calc";
import { loadState, loadStates } from "@/lib/data";

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

  return (
    <div className="stack">
      <header className="page-head">
        <Breadcrumbs items={[{ label: "Vehicle costs", href: "/vehicle/" }, { label: s.name }]} />
        <h1>What a vehicle purchase costs in {s.name}, itemized and sourced.</h1>
        <p className="lede">
          Sales tax, title and registration for a vehicle registered in {s.name}. Every line cites the page it came from and the
          day we opened it.
        </p>
      </header>

      {!pub.publishable && (
        <div className="banner">
          <strong>This state is still being verified.</strong> We have not confirmed every core figure from an official source
          ({pub.reasons.join("; ")}). The totals below leave out anything unconfirmed.
        </div>
      )}

      <Calculator state={s}>
        <WhatChanged state={s} />
      </Calculator>

      <StateContent state={s} />
    </div>
  );
}
