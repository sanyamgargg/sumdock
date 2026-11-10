import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import StateIndex, { type StateRow } from "@/components/StateIndex";
import { formatDate } from "@/lib/format";
import { loadLlcStates } from "@/lib/llc-data";
import { llcCostSummary, llcVerification } from "@/lib/llc-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "/llc/",
  "LLC Cost by State: Formation and Yearly Fees",
  "Pick a state to see what it costs to form an LLC and keep it in good standing. Every figure links to the official page it came from.",
);

export default function LlcIndex() {
  const rows: StateRow[] = loadLlcStates().map((s) => {
    const v = llcVerification(s);
    return {
      slug: s.slug,
      name: s.name,
      code: s.code,
      tax: llcCostSummary(s),
      status: v.status,
      statusLabel: v.label,
      reviewed: formatDate(s.lastReviewed),
    };
  });
  return (
    <div className="stack">
      <header className="page-head">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "LLC costs" }]} />
        <h1>What an LLC costs, by state.</h1>
        <p className="lede">
          Choose the state you would form in. Each page itemizes the state filing fee, the yearly cost to keep the LLC active and
          what is left out, and cites the official page behind every line.
        </p>
        <p className="lede">
          These are estimates of state fees, not legal or tax advice. Federal and state income taxes are not included.{" "}
          <Link href="/methodology/#llc">How we check numbers</Link>.
        </p>
      </header>

      <StateIndex rows={rows} basePath="/llc/" taxHeading="State fees" />
    </div>
  );
}
