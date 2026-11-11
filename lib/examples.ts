import { calculate, isUsable, localRateInputs } from "./calc";
import { DEFAULT_INPUTS } from "./content";
import { usd, usdShort } from "./format";
import type { Inputs, Result, StateData, Status } from "./types";

/** Inputs for the step-by-step example. These are example inputs, not state data. */
export const WALK = { price: 30000, tradeIn: 8000 };

/** "Travis" becomes "Travis County"; "Carson City" and "New York City (Bronx, ...)" keep their own names. */
export function placeName(key: string): string {
  const m = /^(.*) \((.*)\)$/.exec(key);
  const name = m ? m[1] : key;
  if (/\bCity\b/.test(name)) return name;
  return m ? `${name} County (${m[2]} area)` : `${name} County`;
}

export interface Place {
  key: string;
  name: string;
  /** Local rate in percent for rate tables, or the county fee in dollars for fee tables. */
  value: number;
  inputs: Partial<Inputs>;
}

/**
 * Every county the state's data can price, sorted from lowest to highest local rate (or county fee when the state has
 * a fee table and no rate table). Ties sort by name so the choice never changes between builds.
 */
export function rankedPlaces(state: StateData): { kind: "rate" | "fee"; places: Place[] } | null {
  const rates = state.localRates?.rates;
  if (rates?.value && isUsable(rates.status)) {
    const places = Object.keys(rates.value).map((key) => {
      const r = localRateInputs(state, key)!;
      // New York: the same picker sets the county fee table.
      const inputs: Partial<Inputs> = { ...r, county: state.counties ? key : "" };
      return { key, name: placeName(key), value: r.localRatePct, inputs };
    });
    return { kind: "rate", places: places.sort((a, b) => a.value - b.value || a.key.localeCompare(b.key)) };
  }
  const fees = state.counties?.fees;
  if (fees?.value && isUsable(fees.status)) {
    const table = fees.value;
    const places = Object.keys(table).map((key) => ({ key, name: placeName(key), value: table[key], inputs: { county: key } }));
    return { kind: "fee", places: places.sort((a, b) => a.value - b.value || a.key.localeCompare(b.key)) };
  }
  return null;
}

export interface Step {
  id: string;
  label: string;
  /** The working, for example "$22,000.00 × 6.25%". */
  detail?: string;
  amount: number | null;
  kind: "price" | "trade" | "taxable" | "line" | "none";
  status?: Status;
}

export interface Walkthrough {
  inputs: Inputs;
  result: Result;
  /** The county used, when the state's taxes or fees depend on one. */
  place: Place | null;
  steps: Step[];
  /** Yearly or two-yearly lines that come back after the purchase. */
  recurring: { label: string; amount: number; every: "year" | "two years"; byValue: boolean }[];
}

const pct = (n: number) => `${n}%`;

/**
 * A $30,000 purchase worked out line by line, with a trade-in when the state's trade-in rule is confirmed, in the
 * middle county when taxes or fees depend on the county. Every amount comes from calculate().
 */
export function walkthrough(state: StateData): Walkthrough {
  const trade = state.salesTax.tradeInReducesBase;
  const rateNow = state.salesTax.stateRatePct;
  // A trade-in only matters where there is a sales tax for it to reduce.
  const tradeKnown = trade.value !== null && isUsable(trade.status) && !(rateNow.value === 0 && isUsable(rateNow.status));
  const ranked = rankedPlaces(state);
  const place = ranked && ranked.places.length > 0 ? ranked.places[Math.floor((ranked.places.length - 1) / 2)] : null;
  const inputs: Inputs = { ...DEFAULT_INPUTS, price: WALK.price, tradeIn: tradeKnown ? WALK.tradeIn : 0, ...(place?.inputs ?? {}) };
  const result = calculate(state, inputs);

  const steps: Step[] = [{ id: "price", label: "Vehicle price", amount: inputs.price, kind: "price" }];
  const taxLine = result.lines.find((l) => l.id === "state-tax");
  if (inputs.tradeIn > 0) {
    const base = taxLine?.basis?.base ?? inputs.price;
    const credit = inputs.price - base;
    steps.push({
      id: "trade",
      label: "Trade-in",
      detail: credit > 0
        ? credit < inputs.tradeIn
          ? `Only ${usd(credit)} of the ${usd(inputs.tradeIn)} trade-in comes off the taxable price.`
          : `Comes off the price before tax.`
        : `Does not lower the taxable price in ${state.name}.`,
      amount: credit > 0 ? -credit : null,
      kind: "trade",
    });
    steps.push({ id: "taxable", label: "Taxable price", amount: base, kind: "taxable" });
  }

  for (const l of result.lines) {
    let detail: string | undefined;
    if (l.basis) {
      detail = `${usd(l.basis.base)} × ${pct(l.basis.ratePct)} = ${usd(Math.round(l.basis.base * l.basis.ratePct) / 100)}`;
      if (l.basis.capped && l.id === "state-tax") detail += `, capped at ${usd(l.amount)}`;
      if (l.basis.capped && l.id === "local-tax") detail = `Charged on the first ${usd(l.basis.base)} only: ${detail}`;
    } else {
      const fee = state.fees.find((f) => f.id === l.id);
      if (fee?.kind === "percentOfValue" && fee.amount.value !== null) detail = `${pct(fee.amount.value)} of ${usd(inputs.price)}`;
      if (fee?.frequency === "annual") detail = [detail, fee.kind === "percentOfValue" || fee.kind === "valueTable" ? "Due again each year, worked out on the vehicle\u2019s value at the time." : "Due again each year."].filter(Boolean).join(". ");
      if (fee?.frequency === "biennial") detail = [detail, "Covers two years. Due again every two years."].filter(Boolean).join(". ");
    }
    steps.push({ id: l.id, label: l.label, detail, amount: l.amount, kind: "line", status: l.status });
  }

  const rate = state.salesTax.stateRatePct;
  if (!taxLine && rate.value === 0 && isUsable(rate.status)) {
    steps.splice(1, 0, { id: "no-tax", label: "State sales tax", detail: `${state.name} has no state sales tax on vehicles.`, amount: 0, kind: "none" });
  }

  const recurring = result.lines.flatMap((l): Walkthrough["recurring"] => {
    const f = state.fees.find((x) => x.id === l.id);
    if (!f || f.frequency === "once") return [];
    const byValue = f.kind === "percentOfValue" || f.kind === "valueTable";
    return [{ label: l.label, amount: l.amount, every: f.frequency === "annual" ? "year" : "two years", byValue }];
  });

  return { inputs, result, place, steps, recurring };
}

export interface SpreadRow { label: string; place: Place; result: Result }

/** Lowest, middle and highest county for the same $30,000 purchase, so the page shows how much the county matters. */
export function countySpread(state: StateData): { kind: "rate" | "fee"; rows: SpreadRow[] } | null {
  const ranked = rankedPlaces(state);
  if (!ranked || ranked.places.length < 3) return null;
  const p = ranked.places;
  const picks: [string, Place][] = [["Lowest", p[0]], ["Middle", p[Math.floor((p.length - 1) / 2)]], ["Highest", p[p.length - 1]]];
  if (picks[0][1].value === picks[2][1].value) return null;
  const tradeIn = walkthrough(state).inputs.tradeIn;
  return {
    kind: ranked.kind,
    rows: picks.map(([label, place]) => ({
      label,
      place,
      result: calculate(state, { ...DEFAULT_INPUTS, price: WALK.price, tradeIn, ...place.inputs }),
    })),
  };
}

export const spreadValue = (kind: "rate" | "fee", v: number) => (kind === "rate" ? pct(v) : usdShort(v));
