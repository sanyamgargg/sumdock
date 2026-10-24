import Link from "next/link";
import { publishability } from "@/lib/calc";
import { loadStates } from "@/lib/data";
import { site } from "@/lib/site";

const HONEST = [
  {
    title: "Every number has a source",
    body: "Each rate and fee is stored with the official page it came from and the date we opened that page. The state page lists them all.",
  },
  {
    title: "Unconfirmed values stay out of the total",
    body: "If an official page is missing, or two official pages disagree, the figure is left out of your estimate and listed as not included, with the reason.",
  },
  {
    title: "Weaker sources are flagged",
    body: "Values that rest on a county page or an older notice carry a “check source” tag so you know to confirm them.",
  },
  {
    title: "Pages that are not ready stay out of search",
    body: "A state page is only offered to search engines when its core figures are confirmed. Others show a banner saying what is still being verified.",
  },
];

export default function Home() {
  const states = loadStates().map((s) => ({ slug: s.slug, name: s.name, ok: publishability(s).publishable }));
  return (
    <>
      <section className="hero">
        <h1>Calculators where every number links to its official source</h1>
        <p className="lede">
          {site.name} estimates taxes and fees from figures published by state agencies. Each result shows where the number came
          from, when we last checked it, and what we had to leave out.
        </p>
      </section>

      <section aria-labelledby="tools" className="tools">
        <h2 id="tools" className="sr-only">Calculators</h2>
        <article className="card tool-card">
          <div>
            <h3 className="tool-card__title">
              <Link href="/vehicle/">Vehicle tax and fee calculator</Link>
            </h3>
            <p>Estimate sales tax, title and registration fees when you buy or register a vehicle.</p>
          </div>
          <div>
            <p className="tool-card__label">States available now</p>
            <ul className="pill-list">
              {states.map((s) => (
                <li key={s.slug}>
                  <Link href={`/vehicle/${s.slug}/`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <Link href="/vehicle/" className="btn">Open the calculator</Link>
        </article>

        <article className="card tool-card tool-card--next">
          <h3 className="tool-card__title">Next tool</h3>
          <p>
            More calculators will be added here. Each one follows the same rule: no number without an official source.
          </p>
        </article>
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
        <p>
          The full process is on the <Link href="/methodology/">methodology</Link> page.
        </p>
      </section>
    </>
  );
}
