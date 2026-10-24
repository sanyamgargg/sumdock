import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { verificationStatus } from "@/lib/content";
import { loadStates } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Vehicle Sales Tax, Title and Registration Costs by State",
  alternates: { canonical: "/vehicle/" },
};

export default function VehicleIndex() {
  const states = loadStates();
  return (
    <>
      <Breadcrumbs items={[{ label: "Sumdock", href: "/" }, { label: "Vehicle" }]} />
      <section className="hero">
        <h1>Vehicle sales tax, title and registration costs by state</h1>
        <p className="lede">
          Pick your state to estimate what you will pay on top of the price. Every number links to the official page it came from.
        </p>
      </section>
      <ul className="state-grid">
        {states.map((s) => {
          const v = verificationStatus(s);
          return (
            <li key={s.slug}>
              <Link href={`/vehicle/${s.slug}/`} className="state-card">
                <span className="state-card__name">{s.name}</span>
                <span className={`vstatus vstatus--${v.status}`}>
                  <span aria-hidden="true">{v.status === "verified" ? "✓" : v.status === "partial" ? "◐" : "!"}</span> {v.label}
                </span>
                <span className="state-card__meta">
                  {v.status === "in-review" ? v.note : `Data reviewed ${formatDate(s.lastReviewed)}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
