import Link from "next/link";
import Statement from "@/components/Statement";
import { calculate } from "@/lib/calc";
import { DEFAULT_INPUTS, verificationStatus } from "@/lib/content";
import { loadStates } from "@/lib/data";
import { usdShort } from "@/lib/format";
import { footnotes } from "@/lib/sources";
import { site } from "@/lib/site";

const HONEST = [
  {
    title: "Government sources only",
    body: "Figures come from state revenue and motor vehicle agency pages, and in a few places county agency pages. Each is linked next to the number.",
  },
  {
    title: "Dated and re-checked",
    body: "Every value records the day its page was opened. Pages get a changed-page check each month and a full re-verification each January and July.",
  },
  {
    title: "Left out when unsure",
    body: "If we cannot confirm an amount, it is not added to the total. It is listed as not included, with the reason.",
  },
];

export default function Home() {
  const states = loadStates();
  // States listed as live are the ones that are not still in review.
  const live = states.filter((s) => verificationStatus(s).status !== "in-review");

  // The sample statement is a real calculation on the Texas data, run when the site is built.
  const tx = states.find((s) => s.slug === "texas");
  const sample = tx
    ? (() => {
        const county = tx.counties?.fees.value && "Travis" in tx.counties.fees.value ? "Travis" : "";
        const inputs = { ...DEFAULT_INPUTS, county };
        const result = calculate(tx, inputs);
        return { state: tx, inputs, result, notes: footnotes(tx, result.lines.map((l) => l.id)) };
      })()
    : null;

  return (
    <div className="stack stack--home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="hero__eyebrow label">Calculators with receipts</p>
          <h1 id="hero-title">Calculators where every number links to its official source.</h1>
          <p className="hero__lede">
            {site.name} shows the page behind each figure and the date it was last checked, so you can trust the total or verify it
            yourself.
          </p>
          <div className="btn-row">
            <Link href="/vehicle/" className="btn">Open the vehicle calculator</Link>
            <Link href="/methodology/" className="btn btn--ghost">How we check numbers</Link>
          </div>
        </div>
        {sample && (
          <div className="hero__sample">
            <Statement
              compact
              title={`Sample / ${sample.state.name}`}
              aside={usdShort(sample.inputs.price)}
              lines={sample.result.lines}
              footnoteNumbers={sample.notes.byLine}
              linkFootnotes={false}
              total={sample.result.total}
              totalLabel="Total"
            />
            <p className="hero__caption">
              A {usdShort(sample.inputs.price)} gas vehicle{sample.inputs.county ? ` in ${sample.inputs.county} County` : ""}, no trade-in. Items we
              cannot confirm are listed as not included on the state page.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="tools" className="tools">
        <div className="section-head">
          <h2 id="tools">Calculators</h2>
          <p className="section-head__meta">1 live, more on the way</p>
        </div>
        <article className="tool">
          <div className="tool__copy">
            <span className="tool__tag">Live</span>
            <h3 className="tool__title"><Link href="/vehicle/">Vehicle tax, title and registration</Link></h3>
            <p>Sales tax, title and registration fees for the state you register in, with county and city rates where they apply.</p>
          </div>
          <ul className="chips" aria-label="States available now">
            {live.map((s) => (
              <li key={s.slug}><Link href={`/vehicle/${s.slug}/`}>{s.name}</Link></li>
            ))}
            <li className="chips__more">more soon</li>
          </ul>
        </article>
      </section>

      <section aria-labelledby="honest" className="honest">
        <h2 id="honest">How we keep the numbers honest</h2>
        <ol className="honest__list">
          {HONEST.map((h, n) => (
            <li key={h.title} className="honest__item">
              <span className="honest__num">{String(n + 1).padStart(2, "0")}</span>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
