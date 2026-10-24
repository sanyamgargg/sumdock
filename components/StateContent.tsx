import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import {
  exampleScenarios, expandTokens, figures, generatedFaq, generatedSummary, scenarioTitle, sourcesByUrl, statusLabel,
} from "@/lib/content";
import { usd } from "@/lib/format";
import type { Source, StateData } from "@/lib/types";

function SourceLinks({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return <small>No source yet.</small>;
  return (
    <>
      {sources.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="src-link">{s.title}</a>
      ))}
    </>
  );
}

/** Prose under the sources table: how the bill is worked out, common questions, worked examples, and what is left out. */
export default function StateContent({ state }: { state: StateData }) {
  const content = state.content;
  const scenarios = exampleScenarios(state);
  const hasWrittenFaq = (content?.faq ?? []).length > 0;
  // A state's written FAQ replaces the generated rule questions so the same question never appears twice.
  const faq = generatedFaq(state).filter((f) => !hasWrittenFaq || f.kind === "site");
  const rows = figures(state);
  const written = content?.howItWorks ?? [];

  return (
    <>
      <section className="twocol" aria-labelledby="how">
        <div className="how">
          <h2 id="how">How {state.name} works out this bill</h2>
          {content?.intro && <p>{expandTokens(content.intro, state)}</p>}
          {written.length > 0
            ? written.map((b) => (
                <div key={b.text} className="prose-block">
                  <p>{expandTokens(b.text, state)}</p>
                  <p className="prose-block__src"><small>Source: </small><SourceLinks sources={sourcesByUrl(state, b.sources)} /></p>
                </div>
              ))
            : generatedSummary(state).map((t) => <p key={t}>{t}</p>)}
          <details className="details-row">
            <summary>All figures this calculator uses ({rows.length})</summary>
            <ul className="facts">
              {rows.map((f) => (
                <li key={f.label} className="fact">
                  <div className="fact__head">
                    <span className="fact__label">{f.label}</span>
                    <span className="fact__value">{f.value}</span>
                  </div>
                  <span className="fact__status">{statusLabel(f.status)}</span>
                  {f.note && <small className="fact__note">{f.note}</small>}
                  <span className="fact__src"><SourceLinks sources={f.sources} /></span>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {(faq.length > 0 || hasWrittenFaq) && (
          <div className="faq" role="group" aria-labelledby="faq">
            <h2 id="faq" className="sr-only">Common questions</h2>
            {content?.faq?.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>{expandTokens(f.q, state)}</summary>
                <p>{expandTokens(f.text, state)}</p>
                <p className="prose-block__src"><small>Source: </small><SourceLinks sources={sourcesByUrl(state, f.sources)} /></p>
              </details>
            ))}
            {faq.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
                {f.note && <p><small>{f.note}</small></p>}
                {f.sources.length > 0 && <p className="prose-block__src"><small>Source: </small><SourceLinks sources={f.sources} /></p>}
                {f.link && <p><Link href={f.link.href}>{f.link.label}</Link></p>}
              </details>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="examples" className="examples-section">
        <div className="section-head"><h2 id="examples">Worked examples</h2></div>
        <div className="examples">
          {scenarios.map((x, n) => (
            <article key={`${x.caption}-${n}`} className="example">
              <p className="example__caption">{x.caption}</p>
              <h3 className="example__title">{scenarioTitle(x)}</h3>
              <p className="example__total">{usd(x.result.total)}</p>
              <p className="example__desc">{x.description}</p>
              {x.result.excluded.length > 0 && (
                <p className="example__excl">Not included yet: {x.result.excluded.map((e) => e.label).join("; ")}.</p>
              )}
            </article>
          ))}
        </div>
        <p className="muted">
          Each example runs the same calculation as the calculator above. Local tax and county fees are left out unless the
          example says otherwise, because they depend on where you live. Estimates only.
        </p>
      </section>

      <AdSlot name="content" minHeight={250} />

      {state.notes.length > 0 && (
        <section aria-labelledby="notcovered" className="leaves-out">
          <div className="section-head"><h2 id="notcovered">What this calculator leaves out</h2></div>
          <ul className="plain-list">{state.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}
    </>
  );
}
