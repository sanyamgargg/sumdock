import Link from "next/link";
import { loadStates } from "@/lib/data";
import { site } from "@/lib/site";

const HONEST = [
  {
    title: "Official sources only",
    body: "Figures come from state revenue and motor vehicle agency pages, each linked next to the number.",
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
  return (
    <>
      <section className="hero hero--home">
        <h1>Calculators where every number links to its official source.</h1>
        <p className="lede">
          {site.name} shows the page behind each figure and the date it was last checked, so you can trust the total or verify it
          yourself.
        </p>
        <div className="btn-row">
          <Link href="/vehicle/" className="btn">Open the vehicle calculator</Link>
          <Link href="/methodology/" className="btn btn--ghost">How we check numbers</Link>
        </div>
      </section>

      <section aria-labelledby="tools" className="tools-section">
        <h2 id="tools" className="eyebrow">Tools</h2>
        <div className="tools">
          <article className="card tool-card">
            <span className="status">Live</span>
            <h3 className="tool-card__title">
              <Link href="/vehicle/">Vehicle tax and fee calculator</Link>
            </h3>
            <p>
              Sales tax, title and registration fees for the state you register in, with county and city rates where they apply.
            </p>
            <ul className="chip-list" aria-label="States available now">
              {states.map((s) => (
                <li key={s.slug}>
                  <Link href={`/vehicle/${s.slug}/`}>{s.name}</Link>
                </li>
              ))}
              <li className="chip-list__more">more coming</li>
            </ul>
          </article>

          <article className="card tool-card tool-card--next">
            <h3 className="tool-card__title">Next tool</h3>
            <p>More calculators will live here, built to the same standard.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="honest" className="honest">
        <h2 id="honest">How we keep the numbers honest</h2>
        <ul className="honest__list">
          {HONEST.map((h) => (
            <li key={h.title} className="card">
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
