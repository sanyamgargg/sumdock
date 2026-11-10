import { isUsable } from "./calc";
import type { Verification } from "./content";
import { formatDate, usdShort } from "./format";
import { llcPublishability } from "./llc-calc";
import type { LlcFee, LlcState } from "./llc-types";
import type { Source, Status } from "./types";

/** Replaces the only token allowed in hand-written LLC content. */
export const expandLlcTokens = (text: string, state: LlcState) => text.replaceAll("{state}", state.name);

const everyFee = (s: LlcState): LlcFee[] => [...s.formation, ...s.annual];

export function llcSourcesByUrl(state: LlcState, urls: string[]): Source[] {
  const all = everyFee(state).flatMap((f) => f.amount.sources).concat(state.notIncluded.flatMap((n) => n.sources ?? []));
  return urls.map((u) => all.find((s) => s.url === u)).filter((s): s is Source => !!s);
}

/** How far an LLC page can be relied on, with the same words as the vehicle index. */
export function llcVerification(state: LlcState): { status: Verification; label: string; note: string } {
  if (!llcPublishability(state).publishable) {
    return { status: "in-review", label: "In review", note: "Some core figures are not confirmed yet. Totals leave out anything unconfirmed." };
  }
  const used = everyFee(state).map((f) => f.amount).filter((a) => isUsable(a.status));
  if (used.some((a) => a.status === "partial")) {
    return { status: "partial", label: "Sourced, check details", note: "Every figure cites a source; some are marked “check source” because the source is indirect or old." };
  }
  return { status: "verified", label: "Verified", note: "Core figures confirmed on official pages." };
}

const FREQUENCY: Record<LlcFee["frequency"], string> = { once: "one time", annual: "each year", biennial: "every two years" };

/** One line for the index: what it costs to form, and what to keep it, from the data file. */
export function llcCostSummary(state: LlcState): string {
  const main = (fees: LlcFee[]) => fees.find((f) => f.main);
  const form = main(state.formation);
  const yearly = main(state.annual);
  const part = (f: LlcFee | undefined, noun: string) =>
    f && f.amount.value !== null && isUsable(f.amount.status) ? `${usdShort(f.amount.value)} ${noun}` : null;
  const head = [part(form, "to form"), part(yearly, FREQUENCY[yearly?.frequency ?? "annual"])].filter(Boolean);
  if (head.length === 0) return "Fees not confirmed yet";
  const line = head.join(", then ");
  return llcVerification(state).status === "in-review" ? `${line}. Some figures are not confirmed yet.` : line;
}

export interface LlcFigure {
  label: string;
  value: string;
  status: Status;
  note?: string;
  sources: Source[];
}

/** The fees stored in the data file, as the state page lists them. */
export function llcFigures(state: LlcState): LlcFigure[] {
  return everyFee(state).map((f) => ({
    label: f.label,
    value: f.amount.value === null ? "Unknown" : `${usdShort(f.amount.value)} ${FREQUENCY[f.frequency]}`,
    status: f.amount.status,
    note: [f.due, f.amount.note].filter(Boolean).join(" "),
    sources: f.amount.sources,
  }));
}

export interface LlcFaqItem {
  q: string;
  a: string;
  sources: Source[];
  link?: { href: string; label: string };
}

/** Questions every state page answers from its own data. The written FAQ comes before these. */
export function generatedLlcFaq(state: LlcState): LlcFaqItem[] {
  const out: LlcFaqItem[] = [];
  if (state.notIncluded.length > 0) {
    out.push({
      q: `What does the ${state.name} estimate leave out?`,
      a: `${state.notIncluded.map((n) => n.label).join("; ")}. Each is listed with its reason under the estimate.`,
      sources: [],
    });
  }
  out.push({
    q: "Is this legal or tax advice?",
    a: "No. It is an estimate of state fees for a domestic LLC. Federal and state income taxes are not included, and you should confirm every amount with the state agency before you file.",
    sources: [],
  });
  out.push({
    q: "How often is this page updated?",
    a: `The data on this page was last reviewed on ${formatDate(state.lastReviewed)}. Pages get a changed-page check each month and a full re-verification each January and July.`,
    sources: [],
    link: { href: "/methodology/", label: "How we check numbers" },
  });
  return out;
}
