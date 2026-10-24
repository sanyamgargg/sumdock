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
