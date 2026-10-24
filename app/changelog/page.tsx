import type { Metadata } from "next";
import Link from "next/link";
import { loadChangelog, loadStates } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every change to a state's numbers or rules on Sumdock, newest first.",
  alternates: { canonical: "/changelog/" },
};

export default function Changelog() {
  const entries = loadChangelog();
  const slugByCode = new Map(loadStates().map((s) => [s.code, s.slug]));
  return (
    <>
      <h1>Changelog</h1>
      <p>One entry for each change to a state's numbers or rules, newest first. Past entries are not edited.</p>
      <ol className="changes changes--page">
        {entries.map((e) => (
          <li key={`${e.date}-${e.state}-${e.summary}`}>
            <span className="changes__date">{formatDate(e.date)}</span>
            <span>
              {slugByCode.has(e.state) ? <Link href={`/vehicle/${slugByCode.get(e.state)}/`}>{e.stateName}</Link> : e.stateName}
              {": "}
              {e.summary}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
