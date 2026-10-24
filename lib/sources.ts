import type { Source, StateData } from "./types";

/**
 * Sources behind one result line from calculate(). Line ids are set in lib/calc.ts:
 * state-tax, local-tax, oos-credit, use-tax, county-fee, or a fee id from the data file.
 */
export function sourcesForLine(state: StateData, lineId: string): Source[] {
  const st = state.salesTax;
  switch (lineId) {
    case "state-tax":
      return st.stateRatePct.sources;
    case "local-tax":
      return [...st.local.sources, ...(state.localRates?.rates.sources ?? [])];
    case "oos-credit":
      return st.outOfStateCredit.sources;
    case "use-tax":
      return st.useTax?.sources ?? [];
    case "county-fee":
      return state.counties?.fees.sources ?? [];
    default:
      return state.fees.find((f) => f.id === lineId)?.amount.sources ?? [];
  }
}

/** Every distinct source in a state file, for the sources table. */
export function collectSources(state: StateData): { source: Source; usedFor: string[] }[] {
  const map = new Map<string, { source: Source; usedFor: string[] }>();
  const add = (label: string, sources: Source[]) => {
    for (const s of sources) {
      const hit = map.get(s.url);
      if (hit) {
        if (!hit.usedFor.includes(label)) hit.usedFor.push(label);
      } else {
        map.set(s.url, { source: s, usedFor: [label] });
      }
    }
  };
  const st = state.salesTax;
  add("State sales tax rate", st.stateRatePct.sources);
  add("Trade-in rule", st.tradeInReducesBase.sources);
  add("Local tax", st.local.sources);
  add("Tax paid to another state", st.outOfStateCredit.sources);
  if (st.useTax) add(st.useTax.value?.label ?? "Use tax", st.useTax.sources);
  for (const f of state.fees) add(f.label, f.amount.sources);
  if (state.counties) add(state.counties.label, state.counties.fees.sources);
  if (state.localRates) add(state.localRates.label, state.localRates.rates.sources);
  return [...map.values()];
}

export interface Footnotes {
  /** Every source in the state file, in footnote order. Index + 1 is the number shown as [n]. */
  ordered: { source: Source; usedFor: string[] }[];
  /** Footnote numbers for each statement line id, in the order that line's sources are listed. */
  byLine: Record<string, number[]>;
}

/**
 * Footnote numbers for a statement. Sources are numbered in the order the lines appear, and lines that share a
 * source share its number. Sources no current line cites (for example the trade-in rule) are numbered after those,
 * so the sources table always lists everything the page relies on.
 */
export function footnotes(state: StateData, lineIds: string[]): Footnotes {
  const all = collectSources(state);
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
  for (const id of lineIds) {
    byLine[id] = [...new Set(sourcesForLine(state, id).map(take))];
  }
  for (const { source } of all) take(source);
  const byUrl = new Map(all.map((x) => [x.source.url, x]));
  return { ordered: order.map((u) => byUrl.get(u)!).filter(Boolean), byLine };
}

/** Splits "TxDMV - Title Manual" into the publisher and what the page is. Falls back to the whole title. */
export function splitTitle(title: string): { publisher: string | null; page: string } {
  const i = title.indexOf(" - ");
  if (i < 1) return { publisher: null, page: title };
  return { publisher: title.slice(0, i).trim(), page: title.slice(i + 3).trim() };
}

/** Short name for a source link: the part of the title before " - " (the agency), or the whole title. */
export function shortTitle(title: string): string {
  const head = title.split(" - ")[0].trim();
  return head || title;
}
