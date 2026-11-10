import type { LlcFee, LlcState } from "./llc-types";
import type { Footnotes } from "./sources";
import type { Source } from "./types";

const allFees = (s: LlcState): LlcFee[] => [...s.formation, ...s.annual];

/** Sources behind one statement line from calculateLlc(): the line id is the fee id. */
export function llcSourcesForLine(state: LlcState, lineId: string): Source[] {
  return allFees(state).find((f) => f.id === lineId)?.amount.sources ?? [];
}

/** Every distinct source in an LLC file, for the sources table. */
export function collectLlcSources(state: LlcState): Footnotes["ordered"] {
  const map = new Map<string, Footnotes["ordered"][number]>();
  const add = (label: string, sources: Source[]) => {
    for (const s of sources) {
      const hit = map.get(s.url);
      if (!hit) map.set(s.url, { source: s, usedFor: [label] });
      else if (!hit.usedFor.includes(label)) hit.usedFor.push(label);
    }
  };
  for (const f of allFees(state)) add(f.label, f.amount.sources);
  for (const n of state.notIncluded) add(`Not included: ${n.label}`, n.sources ?? []);
  return [...map.values()];
}

/** Footnote numbers in the order the statement lines appear; sources no line cites follow. Same rules as footnotes() for vehicles. */
export function llcFootnotes(state: LlcState, lineIds: string[]): Footnotes {
  const all = collectLlcSources(state);
  const numbers = new Map<string, number>();
  const order: string[] = [];
  const take = (s: Source): number => {
    let n = numbers.get(s.url);
    if (n === undefined) {
      order.push(s.url);
      n = order.length;
      numbers.set(s.url, n);
    }
    return n;
  };
  const byLine: Record<string, number[]> = {};
  for (const id of lineIds) byLine[id] = [...new Set(llcSourcesForLine(state, id).map(take))];
  for (const { source } of all) take(source);
  const byUrl = new Map(all.map((x) => [x.source.url, x]));
  return { ordered: order.map((u) => byUrl.get(u)!).filter(Boolean), byLine };
}
