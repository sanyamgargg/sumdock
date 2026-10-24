import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import StateIndex, { type StateRow } from "@/components/StateIndex";
import { mainTaxSummary, verificationStatus } from "@/lib/content";
import { loadStates } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = pageMetadata(
  "/vehicle/",
  "Vehicle Sales Tax, Title and Registration Costs by State",
  "Pick a state to estimate vehicle sales tax, title and registration fees. Every figure links to the official page it came from.",
);

export default function VehicleIndex() {
  const rows: StateRow[] = loadStates().map((s) => {
    const v = verificationStatus(s);
    return {
      slug: s.slug,
      name: s.name,
      code: s.code,
      tax: mainTaxSummary(s),
      status: v.status,
      statusLabel: v.label,
      reviewed: formatDate(s.lastReviewed),
    };
  });
  return (
    <div className="stack">
      <header className="page-head">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Vehicle costs" }]} />
        <h1>Vehicle tax, title and registration, by state.</h1>
        <p className="lede">
          Choose the state you register in. Each page itemizes the bill and cites the official page behind every line.
        </p>
      </header>

      <StateIndex rows={rows} />
    </div>
  );
}
