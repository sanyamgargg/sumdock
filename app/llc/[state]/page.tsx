import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import LlcCalculator from "@/components/LlcCalculator";
import LlcContent from "@/components/LlcContent";
import WhatChanged from "@/components/WhatChanged";
import { llcPublishability } from "@/lib/llc-calc";
import { loadLlcState, loadLlcStates } from "@/lib/llc-data";
import { llcCostSentence, llcMetadata, llcPageLd } from "@/lib/llc-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadLlcStates().map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const s = loadLlcState(state);
  if (!s) return {};
  return llcMetadata(s);
}

export default async function LlcStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const s = loadLlcState(state);
  if (!s) notFound();
  const pub = llcPublishability(s);
  const answer = llcCostSentence(s);

  return (
    <div className="stack">
      <JsonLd data={llcPageLd(s)} />
      <header className="page-head">
        <Breadcrumbs items={[{ label: "LLC costs", href: "/llc/" }, { label: s.name }]} />
        <h1>What it costs to form and keep an LLC in {s.name}, itemized and sourced.</h1>
        <p className="lede">
          State filing fees and yearly costs for a domestic {s.name} LLC. Every line cites the page it came from and the day we
          opened it. Estimates only, not legal or tax advice; federal and state income taxes are not included.
        </p>
        {answer && <p className="lede">{answer}</p>}
      </header>

      {!pub.publishable && (
        <div className="banner">
          <strong>This state is still being verified.</strong> We have not confirmed every core figure from an official source
          ({pub.reasons.join("; ")}). The totals below leave out anything unconfirmed.
        </div>
      )}

      <LlcCalculator state={s}>
        <WhatChanged state={s} tool="llc" />
      </LlcCalculator>

      <LlcContent state={s} />
    </div>
  );
}
