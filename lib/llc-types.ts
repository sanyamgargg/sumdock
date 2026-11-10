import type { Source, Sourced } from "./types";

/** One state charge on an LLC. Same Sourced shape as the vehicle data, so statuses and sources work the same way. */
export interface LlcFee {
  id: string;
  label: string;
  frequency: "once" | "annual" | "biennial";
  /** The filing fee at formation, or the main yearly fee. Publishability rests on these two. */
  main?: boolean;
  /** Plain-English due date, for example "Due by June 1 each year". Required on yearly fees. */
  due?: string;
  /** Year of ownership (1 is the year the LLC is formed) in which the fee is first counted. Default 1. */
  firstYear?: number;
  amount: Sourced<number>;
}

export interface LlcNotIncluded {
  label: string;
  reason: string;
  sources?: Source[];
}

export interface LlcContentBlock {
  text: string;
  /** URLs that back the rule the text states. Each must be a source elsewhere in this file. */
  sources: string[];
}

/** Hand-written prose. No digits; the only token is {state}. Checked by scripts/validate-llc.mjs. */
export interface LlcContent {
  intro?: string;
  howItWorks?: LlcContentBlock[];
  faq?: (LlcContentBlock & { q: string })[];
}

export interface LlcState {
  code: string;
  name: string;
  slug: string;
  lastReviewed: string;
  formation: LlcFee[];
  annual: LlcFee[];
  notIncluded: LlcNotIncluded[];
  content?: LlcContent;
}

export interface LlcLine {
  id: string;
  label: string;
  amount: number;
  status: Sourced<number>["status"];
  note?: string;
}

export interface LlcResult {
  years: number;
  /** Statement lines: one-time fees first, then each yearly fee times the number of times it falls in the period. */
  lines: LlcLine[];
  formationTotal: number;
  /** Fees charged every year, for one year. */
  yearlyTotal: number;
  /** Fees charged every second year, for one filing. */
  biennialTotal: number;
  /** Formation plus everything due in the chosen number of years. */
  total: number;
  /** Items left out of the total, with the reason. Never silently dropped. */
  excluded: { label: string; reason: string }[];
}
