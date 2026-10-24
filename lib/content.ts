import { calculate, isUsable, publishability } from "./calc";
import { formatDate, usd, usdShort } from "./format";
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

/** Illustrative inputs for the worked examples. These are inputs, not state data. */
const EXAMPLE = { plain: 20000, withTrade: { price: 30000, tradeIn: 8000 }, ev: 45000, fallback: 50000 };

export interface Scenario {
  caption: string;
  inputs: Inputs;
  result: Result;
  /** One generated sentence under the total. */
  description: string;
}

const lineText = (r: Result) => r.lines.map((l) => `${l.label} ${usd(l.amount)}`).join(", ");

/**
 * Up to three scenarios, every figure from calculate(): no trade-in, a trade-in (only when the state's
 * trade-in rule is usable and changes the tax), and an electric vehicle (only when the state has an EV fee).
 */
export function exampleScenarios(state: StateData): Scenario[] {
  const out: Scenario[] = [];
  const run = (caption: string, patch: Partial<Inputs>, describe?: (r: Result) => string | null) => {
    const inputs = { ...DEFAULT_INPUTS, ...patch };
    const result = calculate(state, inputs);
    out.push({ caption, inputs, result, description: describe?.(result) ?? `${lineText(result)}.` });
  };

  run("Gas vehicle, no trade-in", { price: EXAMPLE.plain });

  const t = EXAMPLE.withTrade;
  const without = calculate(state, { ...DEFAULT_INPUTS, price: t.price }).lines.find((l) => l.id === "state-tax");
  const withTrade = calculate(state, { ...DEFAULT_INPUTS, price: t.price, tradeIn: t.tradeIn }).lines.find((l) => l.id === "state-tax");
  if (without && withTrade && without.amount > withTrade.amount) {
    run("Gas vehicle with a trade-in", { price: t.price, tradeIn: t.tradeIn }, () =>
      `Tax is charged on ${usdShort(t.price - t.tradeIn)}, so the trade-in saves ${usd(without.amount - withTrade.amount)} in sales tax.`);
  } else {
    run("Gas vehicle, no trade-in", { price: t.price });
  }

  const hasEvFee = state.fees.some((f) => f.when?.fuel === "ev" || f.minForEv !== undefined);
  if (hasEvFee) run("Electric vehicle", { price: EXAMPLE.ev, fuel: "ev" });
  else run("Gas vehicle, no trade-in", { price: EXAMPLE.fallback });
  return out;
}

/** Heading for a scenario card, e.g. "$30,000 vehicle" or "$30,000 vehicle, $8,000 trade-in". */
export const scenarioTitle = (s: Scenario) =>
  s.inputs.tradeIn > 0 ? `${usdShort(s.inputs.price)} vehicle, ${usdShort(s.inputs.tradeIn)} trade-in` : `${usdShort(s.inputs.price)} vehicle`;

/** Plain-English summary of the rules, one sentence each, written only from usable values. */
export function generatedSummary(state: StateData): string[] {
  const st = state.salesTax;
  const out: string[] = [];
  const rate = st.stateRatePct;
  const trade = st.tradeInReducesBase;
  if (rate.value !== null && isUsable(rate.status)) {
    const tradeOk = trade.value !== null && isUsable(trade.status);
    if (rate.value === 0) out.push(`The state sales tax rate in our ${state.name} data is 0%.`);
    else if (tradeOk && trade.value) out.push(`${state.name} charges ${rate.value}% state sales tax on the price of a vehicle, less any trade-in allowance.`);
    else if (tradeOk) out.push(`${state.name} charges ${rate.value}% state sales tax on the price of a vehicle. A trade-in does not lower the taxable price.`);
    else out.push(`${state.name} charges ${rate.value}% state sales tax on the price of a vehicle.`);
  }
  if (st.useTax?.value && isUsable(st.useTax.status)) {
    out.push(`${st.useTax.value.label} is ${st.useTax.value.ratePct}% and applies only to a new vehicle bought from a dealer outside ${state.name}.`);
  }
  const l = st.local;
  if (l.value && isUsable(l.status)) {
    out.push(l.value.mode === "none"
      ? `Our sources list no local sales tax on vehicles in ${state.name}.`
      : `Local sales tax depends on where you live. Choose your county in the calculator to fill in the local rate.`);
  }
  if (state.counties?.fees.value && isUsable(state.counties.fees.status)) {
    out.push(`${state.counties.label} depends on the county you choose.`);
  }
  out.push("Title and registration fees are listed in the result, each with a link to the page it came from.");
  out.push("A value marked “check source” rests on a weaker source, such as a county page. Confirm it before you pay.");
  return out;
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
  /** Rule questions are replaced by a state's written FAQ; "site" questions are always shown. */
  kind: "rule" | "site";
  /** For answers about the site itself rather than a rule, which have no data-file source. */
  link?: { href: string; label: string };
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
      kind: "rule",
    });
  }
  const c = st.outOfStateCredit;
  if (c.value !== null && isUsable(c.status)) {
    out.push({
      q: "What if I bought the car in another state?",
      a: c.value
        ? `${state.name} gives credit for sales or use tax already paid to another state. Enter that amount in the calculator. It never credits more than the tax owed here.`
        : `The calculator applies no credit for tax paid to another state, because ${state.name} does not provide one.`,
      note: c.note,
      sources: c.sources,
      kind: "rule",
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
      kind: "rule",
    });
  }
  out.push({
    q: "How often is this page updated?",
    a: `The data on this page was last reviewed on ${formatDate(state.lastReviewed)}. Pages get a changed-page check each month and a full re-verification each January and July.`,
    sources: [],
    kind: "site",
    link: { href: "/methodology/", label: "How we check numbers" },
  });
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

export type Verification = "verified" | "partial" | "in-review";

/**
 * How far a state's data can be relied on, for the state index.
 * in-review: core figures missing (the page is noindex). partial: publishable, but at least one value that
 * enters totals is a "check source" one. verified: every value that enters totals is verified.
 */
/**
 * One line for the state index: the state rate, and what kind of local rate sits on top of it.
 * Built from the data file so it cannot drift from the calculator. In-review states say so instead of
 * implying every figure is settled.
 */
export function mainTaxSummary(state: StateData): string {
  const rate = state.salesTax.stateRatePct.value;
  const rates = state.localRates?.rates.value ?? null;
  let line: string;
  if (rate === null || !isUsable(state.salesTax.stateRatePct.status)) {
    line = "State rate not confirmed yet";
  } else if (rate === 0) {
    line = "No sales tax";
  } else {
    line = `${rate}% sales tax`;
    const hasPlaces = !!rates && Object.values(rates).some((c) => Object.keys(c.places).length > 0);
    if (rates) {
      if (state.localRates?.mode === "localOnly") line += hasPlaces ? " plus county and city surtax" : " plus county surtax";
      else line += hasPlaces ? " plus county and city rate" : " plus county rate";
    } else if (state.salesTax.local.value?.mode === "user-entered") {
      line += " plus local rate";
    }
  }
  return verificationStatus(state).status === "in-review" ? `${line}. Some figures are not confirmed yet.` : line;
}

export function verificationStatus(state: StateData): { status: Verification; label: string; note: string } {
  if (!publishability(state).publishable) {
    return {
      status: "in-review",
      label: "In review",
      note: "Some core figures are not confirmed yet. Totals leave out anything unconfirmed.",
    };
  }
  const st = state.salesTax;
  const used = [st.stateRatePct, st.tradeInReducesBase, st.local, ...state.fees.map((f) => f.amount)].filter((s) => isUsable(s.status));
  if (used.some((s) => s.status === "partial")) {
    return { status: "partial", label: "Partly verified", note: "Some figures are marked “check source”." };
  }
  return { status: "verified", label: "Verified", note: "Core figures confirmed on official pages." };
}
