export type Status = "verified" | "partial" | "conflict" | "unverified";

export interface Source {
  title: string;
  url: string;
  /** ISO date the page was opened. */
  accessed: string;
  publisherType: "state-agency" | "county-agency" | "secondary";
}

/** A value plus where it came from. Nothing is shown to users without one. */
export interface Sourced<T> {
  value: T | null;
  /** Other values seen in sources (for conflicts or county variation). */
  alt?: T[];
  status: Status;
  sources: Source[];
  note?: string;
}

export type Fuel = "gas" | "ev";
export type MpgBand = "0-19" | "20-39" | "40+";
export type WeightBand = "light" | "mid" | "heavy";

export interface FeeWhen {
  fuel?: Fuel;
  mpgBand?: MpgBand;
  weightBand?: WeightBand;
  noPlateToTransfer?: boolean;
}

export interface Fee {
  id: string;
  label: string;
  kind: "flat" | "percentOfValue" | "weightTable" | "valueTable";
  frequency: "once" | "annual" | "biennial";
  when?: FeeWhen;
  /** For weightTable (by weight) or valueTable (by price): first row whose upTo >= weight wins; upTo null means "and over". */
  weightTable?: { upTo: number | null; fee: number }[];
  /** For weightTable: minimum fee applied to electric vehicles. */
  minForEv?: number;
  /** Different flat amount for residents of the listed counties (Texas title fee: 33 in 42 counties). Needs the county picker. */
  altCounties?: { counties: string[]; amount: number };
  /** Shown instead of the generic reason when the fee is left out. */
  excludedReason?: string;
  /** For percentOfValue the amount is a percent (0.65 means 0.65%). */
  amount: Sourced<number>;
}

export interface LocalRule {
  mode: "none" | "user-entered";
  /** Local tax applies only to this much of the taxable base (Florida: 5000). */
  capBase: number | null;
  rangeNote: string | null;
}

export interface UseTaxRule {
  ratePct: number;
  label: string;
  requires: "outOfStateNewDealer";
}

export interface StateData {
  code: string;
  name: string;
  slug: string;
  lastReviewed: string;
  salesTax: {
    stateRatePct: Sourced<number>;
    tradeInReducesBase: Sourced<boolean>;
    /** Most the trade-in can reduce the taxable price (Michigan: 12000). Omit when there is no cap. */
    tradeInCap?: number | null;
    local: Sourced<LocalRule>;
    outOfStateCredit: Sourced<boolean>;
    useTax: Sourced<UseTaxRule> | null;
  };
  fees: Fee[];
  /** Optional per-county fee added to registration (Texas local fee). */
  counties?: {
    label: string;
    fees: Sourced<Record<string, number>>;
    /** Optional amounts used instead when the vehicle weighs more than heavyOverLbs (New York use tax). Same keys as fees. */
    heavyFees?: Record<string, number>;
    heavyOverLbs?: number;
  };
  /** Optional combined sales/use tax rates by county and city, used to fill the local rate. */
  localRates?: {
    label: string;
    /** combined: rate includes the state rate (subtract it). localOnly: the rate is the local part already. */
    mode: "combined" | "localOnly";
    rates: Sourced<Record<string, { county: number; places: Record<string, number> }>>;
  };
  notes: string[];
  /**
   * Optional hand-written prose for the state page. No digits allowed in the text: figures come from
   * tokens ({state}, {stateRate}) so they always match the data. Each block must cite source URLs
   * that already appear in this file. Checked by scripts/validate-data.mjs.
   */
  content?: StateContent;
}

export interface ContentBlock {
  text: string;
  /** URLs that back the rule the text states. Each must be a source elsewhere in this file. */
  sources: string[];
}

export interface StateContent {
  intro?: string;
  howItWorks?: ContentBlock[];
  faq?: (ContentBlock & { q: string })[];
}

export interface Inputs {
  price: number;
  tradeIn: number;
  /** Combined local rate in percent, entered by the user. */
  localRatePct: number;
  /** Tax already paid to another state. */
  outOfStateTaxPaid: number;
  fuel: Fuel;
  mpgBand: MpgBand;
  weightBand: WeightBand;
  /** Curb weight in pounds, used by weight-table states (New York). */
  weightLbs: number;
  /** Selected county name, empty if none chosen. */
  county: string;
  noPlateToTransfer: boolean;
  outOfStateNewDealer: boolean;
}

export interface Line {
  id: string;
  label: string;
  amount: number;
  status: Status;
  note?: string;
}

export interface Result {
  lines: Line[];
  total: number;
  /** Items we could not price, with the reason. Shown to the user, never silently dropped. */
  excluded: { label: string; reason: string }[];
}
