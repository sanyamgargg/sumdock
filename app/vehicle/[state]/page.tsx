import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Calculator from "@/components/Calculator";
import { publishability } from "@/lib/calc";
import { loadState, loadStates } from "@/lib/data";
import type { Fee, Sourced } from "@/lib/types";

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

function fmt(v: unknown) {
  return typeof v === "number" ? String(v) : v === null ? "unknown" : String(v);
}

function SourceCell({ s }: { s: Sourced<unknown> }) {
  return (
    <>
      {s.sources.map((x) => (
        <div key={x.url}>
          <a href={x.url} rel="noopener noreferrer" target="_blank">{x.title}</a>
          <br />
          <small>opened {x.accessed}{x.publisherType === "secondary" ? " (secondary source)" : ""}</small>
        </div>
      ))}
      {s.sources.length === 0 && <small>no source yet</small>}
      {s.note && <div><small>{s.note}</small></div>}
    </>
  );
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const s = loadState(state);
  if (!s) notFound();
  const pub = publishability(s);
  const st = s.salesTax;
  const rows: { label: string; value: string; src: Sourced<unknown> }[] = [
    { label: "State tax rate", value: st.stateRatePct.value === null ? "unknown" : `${st.stateRatePct.value}%`, src: st.stateRatePct },
    { label: "Trade-in reduces taxable price", value: st.tradeInReducesBase.value === null ? "unknown" : st.tradeInReducesBase.value ? "Yes" : "No", src: st.tradeInReducesBase },
    { label: "Local tax", value: st.local.value ? (st.local.value.mode === "none" ? "None" : "Varies by location") : "unknown", src: st.local },
    ...(st.useTax && st.useTax.value
      ? [{ label: st.useTax.value.label, value: `${st.useTax.value.ratePct}%`, src: st.useTax as Sourced<unknown> }]
      : []),
    ...s.fees.map((f: Fee) => ({
      label: f.label,
      value: f.amount.value === null ? (f.amount.alt ? `unclear (${f.amount.alt.map((a) => "$" + a).join(" or ")})` : "unknown") : f.kind === "percentOfValue" ? `${f.amount.value}% of value` : `$${fmt(f.amount.value)}`,
      src: f.amount as Sourced<unknown>,
    })),
  ];

  return (
    <>
      <h1>{s.name} vehicle sales tax, title and registration fees</h1>
      <p className="lede">Last reviewed {s.lastReviewed}. Estimates only.</p>

      {!pub.publishable && (
        <div className="banner">
          <strong>This state is still being verified.</strong> We have not confirmed every core figure from an official source
          ({pub.reasons.join("; ")}). The totals below leave out anything unconfirmed.
        </div>
      )}

      <Calculator state={s} />

      <h2>Where these numbers come from</h2>
      <table className="sources">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{r.value}<br /><small>{r.src.status}</small></td>
              <td><SourceCell s={r.src} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {s.notes.length > 0 && (
        <>
          <h2>Not covered yet</h2>
          <ul>{s.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </>
      )}
    </>
  );
}
