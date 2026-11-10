import { isUsable } from "./calc";
import type { LlcFee, LlcResult, LlcState } from "./llc-types";

export const MIN_YEARS = 1;
export const MAX_YEARS = 5;
export const DEFAULT_YEARS = 3;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const clampYears = (n: number) => Math.min(MAX_YEARS, Math.max(MIN_YEARS, Math.round(Number.isFinite(n) ? n : DEFAULT_YEARS)));

const usableAmount = (f: LlcFee): number | null => (f.amount.value !== null && isUsable(f.amount.status) ? f.amount.value : null);

/**
 * How many times a fee falls in the first `years` years of ownership (year 1 is the year the LLC is formed).
 * An annual fee is due each year from its first year. A biennial fee is due in its first year and every second year after.
 */
export function occurrences(fee: LlcFee, years: number): number {
  if (fee.frequency === "once") return 1;
  const first = fee.firstYear ?? 1;
  if (years < first) return 0;
  return fee.frequency === "annual" ? years - first + 1 : Math.floor((years - first) / 2) + 1;
}

function lineLabel(fee: LlcFee, count: number): string {
  if (fee.frequency === "once") return fee.label;
  if (count === 0) return `${fee.label} (first due in year ${fee.firstYear ?? 1})`;
  return count === 1 ? fee.label : `${fee.label} (${count} times)`;
}

export function calculateLlc(state: LlcState, yearsInput: number): LlcResult {
  const years = clampYears(yearsInput);
  const lines: LlcResult["lines"] = [];
  const excluded: LlcResult["excluded"] = [];
  let formationTotal = 0;
  let yearlyTotal = 0;
  let biennialTotal = 0;
  let total = 0;

  const add = (fee: LlcFee) => {
    const amount = usableAmount(fee);
    if (amount === null) {
      const why = fee.amount.status === "conflict" ? "Official pages disagree." : "Not confirmed from an official source yet.";
      excluded.push({ label: fee.label, reason: fee.amount.note ? `${why} ${fee.amount.note}` : why });
      return;
    }
    const count = occurrences(fee, years);
    if (fee.frequency === "once") formationTotal += amount;
    else if (fee.frequency === "annual") yearlyTotal += amount;
    else biennialTotal += amount;
    total += amount * count;
    lines.push({
      id: fee.id,
      label: lineLabel(fee, count),
      amount: round2(amount * count),
      status: fee.amount.status,
      note: fee.amount.note,
    });
  };

  state.formation.forEach(add);
  state.annual.forEach(add);
  for (const n of state.notIncluded) excluded.push({ label: n.label, reason: n.reason });

  return {
    years,
    lines,
    formationTotal: round2(formationTotal),
    yearlyTotal: round2(yearlyTotal),
    biennialTotal: round2(biennialTotal),
    total: round2(total),
    excluded,
  };
}

/** A state page may be indexed only when the formation filing fee and the main yearly fee are usable. */
export function llcPublishability(state: LlcState): { publishable: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!state.formation.some((f) => f.main && usableAmount(f) !== null)) reasons.push("formation filing fee not verified");
  if (!state.annual.some((f) => f.main && usableAmount(f) !== null)) reasons.push("main yearly fee not verified");
  return { publishable: reasons.length === 0, reasons };
}
