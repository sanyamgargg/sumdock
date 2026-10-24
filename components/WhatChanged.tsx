import { loadChangelog } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { StateData } from "@/lib/types";

/** Changes to this state's numbers and rules, newest first, from data/changelog.json. Renders nothing if there are none. */
export default function WhatChanged({ state }: { state: StateData }) {
  const entries = loadChangelog().filter((e) => e.state === state.code);
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="changed" className="changed">
      <div className="section-head">
        <h2 id="changed">What changed</h2>
        <p className="section-head__meta">{entries.length} {entries.length === 1 ? "change" : "changes"} to {state.name}'s numbers or rules</p>
      </div>
      <ol className="changes">
        {entries.map((e) => (
          <li key={`${e.date}-${e.summary}`}>
            <span className="changes__date">{formatDate(e.date)}</span>
            <span>{e.summary}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
