import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Calculator from "@/components/Calculator";
import StateContent from "@/components/StateContent";
import WhatChanged from "@/components/WhatChanged";
import { publishability } from "@/lib/calc";
import JsonLd from "@/components/JsonLd";
import { loadState, loadStates } from "@/lib/data";
import { answerSentence, stateMetadata, statePageLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadStates().map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const s = loadState(state);
  if (!s) return {};
  return stateMetadata(s);
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const s = loadState(state);
  if (!s) notFound();
  const pub = publishability(s);
  const answer = answerSentence(s);

  return (
    <div className="stack">
      <JsonLd data={statePageLd(s)} />
      <header className="page-head">
        <Breadcrumbs items={[{ label: "Vehicle costs", href: "/vehicle/" }, { label: s.name }]} />
        <h1>What a vehicle purchase costs in {s.name}, itemized and sourced.</h1>
        <p className="lede">
          Sales tax, title and registration for a vehicle registered in {s.name}. Every line cites the page it came from and the
          day we opened it.
        </p>
        {answer && <p className="lede">{answer}</p>}
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
