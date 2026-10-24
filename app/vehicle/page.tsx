import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusMark from "@/components/StatusMark";
import { mainTaxSummary, verificationStatus } from "@/lib/content";
import { loadStates } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Vehicle Sales Tax, Title and Registration Costs by State",
  alternates: { canonical: "/vehicle/" },
};

export default function VehicleIndex() {
  const states = loadStates();
  return (
    <div className="stack">
      <header className="page-head">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Vehicle costs" }]} />
        <h1>Vehicle tax, title and registration, by state.</h1>
        <p className="lede">
          Choose the state you register in. Each page itemizes the bill and cites the official page behind every line.
        </p>
      </header>

      <section aria-labelledby="states-title">
        <h2 id="states-title" className="sr-only">States</h2>
        <div className="states__head" aria-hidden="true">
          <span>State</span><span>Main tax</span><span>Data status</span><span>Reviewed</span><span />
        </div>
        <ul className="states">
          {states.map((s) => {
            const v = verificationStatus(s);
            const review = v.status === "in-review";
            return (
              <li key={s.slug} className={review ? "state-row is-review" : "state-row"}>
                <span className="state-row__name">{review ? s.name : <Link href={`/vehicle/${s.slug}/`}>{s.name}</Link>}</span>
                <span className="state-row__tax">{mainTaxSummary(s)}</span>
                <span className="state-row__status"><StatusMark status={v.status} label={v.label} /></span>
                <span className="state-row__date">{formatDate(s.lastReviewed)}</span>
                <span className="state-row__go">
                  {!review && (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" />
                    </svg>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <ul className="legend" aria-label="What the status words mean">
          <li><StatusMark status="verified" label="Verified" />: every figure in the total is confirmed on an official page.</li>
          <li><StatusMark status="partial" label="Partly verified" />: some figures are marked “check source”.</li>
          <li><StatusMark status="in-review" label="In review" />: a core figure is not confirmed, so the page is not yet public.</li>
        </ul>
      </section>
    </div>
  );
}
