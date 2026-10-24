import AdSlot from "@/components/AdSlot";
import {
  expandTokens, figures, generatedFaq, sourcesByUrl, statusLabel, tradeInExample, workedExamples,
} from "@/lib/content";
import { formatDate, usd, usdShort } from "@/lib/format";
import { collectSources } from "@/lib/sources";
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

export default function StateContent({ state }: { state: StateData }) {
  const content = state.content;
  const examples = workedExamples(state);
  const trade = tradeInExample(state);
  const faq = generatedFaq(state);
  const sources = collectSources(state);
  const hasHowItWorks = (content?.howItWorks ?? []).length > 0;

  return (
    <div className="content">
      <section aria-labelledby="how">
        <h2 id="how">How {state.name} works out this bill</h2>
        {content?.intro && <p>{expandTokens(content.intro, state)}</p>}
        {content?.howItWorks?.map((b) => (
          <div key={b.text} className="prose-block">
            <p>{expandTokens(b.text, state)}</p>
            <p className="prose-block__src"><small>Source: </small><SourceLinks sources={sourcesByUrl(state, b.sources)} /></p>
          </div>
        ))}
        {!hasHowItWorks && (
          <p className="muted">Below are the figures this calculator uses, with the status of each one and where it comes from.</p>
        )}
        <ul className="facts">
          {figures(state).map((f) => (
            <li key={f.label} className="fact">
              <div className="fact__head">
                <span className="fact__label">{f.label}</span>
                <span className="fact__value">{f.value}</span>
              </div>
              <span className={`status status--${f.status}`}>{statusLabel(f.status)}</span>
              {f.note && <small className="fact__note">{f.note}</small>}
              <span className="fact__src"><SourceLinks sources={f.sources} /></span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="examples">
        <h2 id="examples">Worked examples</h2>
        <p className="muted">
          These run the same calculation as the calculator above, for a gas vehicle with no trade-in. Local tax and county
          fees are left out because they depend on where you live. Estimates only.
        </p>
        <div className="examples">
          {examples.map((ex) => (
            <article key={ex.inputs.price} className="card example">
              <h3>{usdShort(ex.inputs.price)} vehicle</h3>
              <ul className="lines">
                {ex.result.lines.map((l) => (
                  <li key={l.id} className="line">
                    <span className="line__main">{l.label}</span>
                    <b className="line__amt">{usd(l.amount)}</b>
                  </li>
                ))}
                <li className="line line--total">
                  <span className="line__main">Estimated total</span>
                  <b className="line__amt">{usd(ex.result.total)}</b>
                </li>
              </ul>
              {ex.result.excluded.length > 0 && (
                <p className="example__excl"><small>Not included yet: {ex.result.excluded.map((e) => e.label).join("; ")}.</small></p>
              )}
            </article>
          ))}
        </div>
        {trade && (
          <p>
            With a {usdShort(trade.tradeIn)} trade-in on a {usdShort(trade.price)} vehicle, the {state.name} sales tax line goes
            from {usd(trade.without)} to {usd(trade.with)}.
          </p>
        )}
      </section>

      <AdSlot name="content" minHeight={280} />

      {(faq.length > 0 || (content?.faq ?? []).length > 0) && (
        <section aria-labelledby="faq">
          <h2 id="faq">Common questions</h2>
          <div className="faq">
            {faq.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
                {f.note && <p><small>{f.note}</small></p>}
                <p className="prose-block__src"><small>Source: </small><SourceLinks sources={f.sources} /></p>
              </details>
            ))}
            {content?.faq?.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>{expandTokens(f.q, state)}</summary>
                <p>{expandTokens(f.text, state)}</p>
                <p className="prose-block__src"><small>Source: </small><SourceLinks sources={sourcesByUrl(state, f.sources)} /></p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="sources">
        <h2 id="sources">Sources</h2>
        <p className="muted">Every page below was opened and read before its figures were entered. Dates are when we opened each one.</p>
        <div className="table-scroll">
          <table className="sources">
            <thead>
              <tr><th scope="col">Source</th><th scope="col">Used for</th><th scope="col">Type</th><th scope="col">Opened</th></tr>
            </thead>
            <tbody>
              {sources.map(({ source, usedFor }) => (
                <tr key={source.url}>
                  <td><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></td>
                  <td>{usedFor.join(", ")}</td>
                  <td>{source.publisherType === "state-agency" ? "State agency" : source.publisherType === "county-agency" ? "County agency" : "Secondary"}</td>
                  <td>{formatDate(source.accessed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {state.notes.length > 0 && (
        <section aria-labelledby="notcovered">
          <h2 id="notcovered">What this calculator leaves out</h2>
          <ul className="plain-list">{state.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
