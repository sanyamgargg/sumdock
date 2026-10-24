import { calculate, isUsable } from "./calc";
import { usdShort } from "./format";
import type { Inputs, Result, Source, StateData, Status } from "./types";

/** Starting values of the calculator. The worked examples reuse them so the two never drift apart. */
export const DEFAULT_INPUTS: Inputs = {
  price: 30000,
  tradeIn: 0,
  localRatePct: 0,
  outOfStateTaxPaid: 0,
  fuel: "gas",
  mpgBand: "20-39",
  weightBand: "mid",
  weightLbs: 3500,
  county: "",
  noPlateToTransfer: true,
  outOfStateNewDealer: false,
};

/** Illustrative purchase prices for the worked examples. These are inputs, not state data. */
const EXAMPLE_PRICES = [15000, 30000, 50000];
const EXAMPLE_TRADE_IN = 10000;

export interface Example {
  inputs: Inputs;
  result: Result;
}

export function workedExamples(state: StateData): Example[] {
  return EXAMPLE_PRICES.map((price) => {
    const inputs = { ...DEFAULT_INPUTS, price };
    return { inputs, result: calculate(state, inputs) };
  });
}

/** Same purchase with and without a trade-in, or null when the trade-in does not change the sales tax line. */
export function tradeInExample(state: StateData) {
  const base = { ...DEFAULT_INPUTS };
  const withTrade = { ...DEFAULT_INPUTS, tradeIn: EXAMPLE_TRADE_IN };
  const a = calculate(state, base).lines.find((l) => l.id === "state-tax");
  const b = calculate(state, withTrade).lines.find((l) => l.id === "state-tax");
  if (!a || !b || a.amount === b.amount) return null;
  return { price: base.price, tradeIn: EXAMPLE_TRADE_IN, without: a.amount, with: b.amount };
}

const STATUS_LABEL: Record<Status, string> = {
  verified: "Verified",
  partial: "Check source",
  conflict: "Sources disagree",
  unverified: "Not verified",
};
export const statusLabel = (s: Status) => STATUS_LABEL[s];

export interface Figure {
  label: string;
  value: string;
  status: Status;
  note?: string;
  sources: Source[];
}

/** The rates and fees stored in the data file, as the state page lists them. */
export function figures(state: StateData): Figure[] {
  const st = state.salesTax;
  const out: Figure[] = [
    { label: "State sales tax rate", value: st.stateRatePct.value === null ? "Unknown" : `${st.stateRatePct.value}%`, status: st.stateRatePct.status, note: st.stateRatePct.note, sources: st.stateRatePct.sources },
    { label: "Trade-in reduces taxable price", value: st.tradeInReducesBase.value === null ? "Unknown" : st.tradeInReducesBase.value ? "Yes" : "No", status: st.tradeInReducesBase.status, note: st.tradeInReducesBase.note, sources: st.tradeInReducesBase.sources },
    { label: "Local tax", value: st.local.value ? (st.local.value.mode === "none" ? "None" : "Varies by location") : "Unknown", status: st.local.status, note: st.local.note, sources: st.local.sources },
  ];
  if (st.useTax?.value) {
    out.push({ label: st.useTax.value.label, value: `${st.useTax.value.ratePct}%`, status: st.useTax.status, note: st.useTax.note, sources: st.useTax.sources });
  }
  for (const f of state.fees) {
    const a = f.amount;
    let value: string;
    if (f.kind === "weightTable" || f.kind === "valueTable") value = isUsable(a.status) ? (f.kind === "weightTable" ? "Depends on weight" : "Depends on price") : "Unknown";
    else if (a.value === null) value = a.alt ? `Unclear (${a.alt.map((x) => usdShort(x)).join(" or ")})` : "Unknown";
    else value = f.kind === "percentOfValue" ? `${a.value}% of value` : usdShort(a.value);
    out.push({ label: f.label, value, status: a.status, note: a.note, sources: a.sources });
  }
  return out;
}

export interface FaqItem {
  q: string;
  a: string;
  note?: string;
  sources: Source[];
}

/** Questions answerable straight from usable values in the data file. Anything unconfirmed is skipped. */
export function generatedFaq(state: StateData): FaqItem[] {
  const st = state.salesTax;
  const out: FaqItem[] = [];
  const t = st.tradeInReducesBase;
  if (t.value !== null && isUsable(t.status)) {
    out.push({
      q: "Does a trade-in lower the tax?",
      a: t.value
        ? `Yes. In ${state.name} the trade-in value comes off the price before the state sales tax rate is applied.`
        : `No. In ${state.name} the trade-in value does not reduce the price the state sales tax is figured on.`,
      note: t.note,
      sources: t.sources,
    });
  }
  const c = st.outOfStateCredit;
  if (c.value !== null && isUsable(c.status)) {
    out.push({
      q: "Do I get credit for tax I already paid to another state?",
      a: c.value
        ? `Yes. ${state.name} gives credit for sales or use tax already paid to another state. The calculator never credits more than the tax owed here.`
        : `No. The calculator applies no credit for tax paid to another state, because ${state.name} does not provide one.`,
      note: c.note,
      sources: c.sources,
    });
  }
  const l = st.local;
  if (l.value && isUsable(l.status)) {
    out.push({
      q: `Is there local sales tax on a vehicle in ${state.name}?`,
      a:
        l.value.mode === "none"
          ? `Our sources list no local sales tax on vehicles in ${state.name}.`
          : `Yes, it depends on where you live. Pick your county in the calculator, or enter your local rate yourself.`,
      note: l.note ?? l.value.rangeNote ?? undefined,
      sources: l.sources,
    });
  }
  return out;
}

/** Replaces the tokens allowed in hand-written content with values from the data file. */
export function expandTokens(text: string, state: StateData): string {
  const rate = state.salesTax.stateRatePct.value;
  return text.replaceAll("{state}", state.name).replaceAll("{stateRate}", rate === null ? "the state rate" : `${rate}%`);
}

export function sourcesByUrl(state: StateData, urls: string[]): Source[] {
  const all = [
    ...state.salesTax.stateRatePct.sources,
    ...state.salesTax.tradeInReducesBase.sources,
    ...state.salesTax.local.sources,
    ...state.salesTax.outOfStateCredit.sources,
    ...(state.salesTax.useTax?.sources ?? []),
    ...state.fees.flatMap((f) => f.amount.sources),
    ...(state.counties?.fees.sources ?? []),
    ...(state.localRates?.rates.sources ?? []),
  ];
  return urls.map((u) => all.find((s) => s.url === u)).filter((s): s is Source => !!s);
}
