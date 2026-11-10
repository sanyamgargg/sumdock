import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { expandLlcTokens, generatedLlcFaq, llcFigures, llcSourcesByUrl } from "@/lib/llc-content";
import type { LlcState } from "@/lib/llc-types";
import { statusLabel } from "@/lib/content";
import type { Source } from "@/lib/types";

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

/** Prose under the sources table: how the state charges an LLC, common questions, and what is left out. */
export default function LlcContent({ state }: { state: LlcState }) {
  const content = state.content;
  const written = content?.howItWorks ?? [];
  const rows = llcFigures(state);
  const generated = generatedLlcFaq(state);

  return (
    <>
      <section className="twocol" aria-labelledby="how">
        <div className="how">
          <h2 id="how">How {state.name} charges an LLC</h2>
          {content?.intro && <p>{expandLlcTokens(content.intro, state)}</p>}
          {written.map((b) => (
            <div key={b.text} className="prose-block">
              <p>{expandLlcTokens(b.text, state)}</p>
              <p className="prose-block__src"><small>Source: </small><SourceLinks sources={llcSourcesByUrl(state, b.sources)} /></p>
            </div>
          ))}
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

        <div className="faq" role="group" aria-labelledby="faq">
          <h2 id="faq" className="sr-only">Common questions</h2>
          {content?.faq?.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>{expandLlcTokens(f.q, state)}</summary>
              <p>{expandLlcTokens(f.text, state)}</p>
              <p className="prose-block__src"><small>Source: </small><SourceLinks sources={llcSourcesByUrl(state, f.sources)} /></p>
            </details>
          ))}
          {generated.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
              {f.link && <p><Link href={f.link.href}>{f.link.label}</Link></p>}
            </details>
          ))}
        </div>
      </section>

      <AdSlot name="content" minHeight={250} />

      <section aria-labelledby="notcovered" className="leaves-out">
        <div className="section-head"><h2 id="notcovered">What this estimate leaves out</h2></div>
        <ul className="plain-list">
          {state.notIncluded.map((n) => (
            <li key={n.label}>
              <b>{n.label}.</b> {n.reason}
              {n.sources && n.sources.length > 0 && <> <small>Source: </small><SourceLinks sources={n.sources} /></>}
            </li>
          ))}
        </ul>
        <p className="muted">This is an estimate of state fees, not legal or tax advice. Federal and state income taxes are not included.</p>
      </section>
    </>
  );
}
