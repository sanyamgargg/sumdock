import { loadChangelog, type ChangelogTool } from "@/lib/data";
import { formatDate } from "@/lib/format";

/** Changes to this state's numbers and rules, newest first, from data/changelog.json. Renders nothing if there are none. */
export default function WhatChanged({ state, tool = "vehicle" }: { state: { code: string; name: string }; tool?: ChangelogTool }) {
  const entries = loadChangelog().filter((e) => e.state === state.code && e.tool === tool);
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
