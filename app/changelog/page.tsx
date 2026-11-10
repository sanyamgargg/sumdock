import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { loadChangelog, loadStates } from "@/lib/data";
import { loadLlcStates } from "@/lib/llc-data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = pageMetadata("/changelog/", "Changelog", "Every change to a state's numbers or rules on Sumdock, newest first.");

export default function Changelog() {
  const entries = loadChangelog();
  const slugs = {
    vehicle: new Map(loadStates().map((s) => [s.code, s.slug])),
    llc: new Map(loadLlcStates().map((s) => [s.code, s.slug])),
  };
  const TOOL = { vehicle: "Vehicle", llc: "LLC" } as const;
  return (
    <>
      <h1>Changelog</h1>
      <p>One entry for each change to a state's numbers or rules, newest first, with the calculator it belongs to. Past entries are not edited.</p>
      <ol className="changes changes--page">
        {entries.map((e) => (
          <li key={`${e.date}-${e.tool}-${e.state}-${e.summary}`}>
            <span className="changes__date">{formatDate(e.date)}</span>
            <span>
              <b>{TOOL[e.tool]}</b>{" / "}
              {slugs[e.tool].has(e.state) ? <Link href={`/${e.tool}/${slugs[e.tool].get(e.state)}/`}>{e.stateName}</Link> : e.stateName}
              {": "}
              {e.summary}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
