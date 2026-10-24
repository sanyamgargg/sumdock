import type { Fee, FeeWhen, Inputs, Line, Result, StateData, Status } from "./types";

const USABLE: Status[] = ["verified", "partial"];

export const isUsable = (s: Status) => USABLE.includes(s);

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function matches(when: FeeWhen | undefined, i: Inputs): boolean {
  if (!when) return true;
  if (when.fuel !== undefined && when.fuel !== i.fuel) return false;
  // MPG bands only apply to non-EV vehicles.
  if (when.mpgBand !== undefined && (i.fuel === "ev" || when.mpgBand !== i.mpgBand)) return false;
  if (when.weightBand !== undefined && when.weightBand !== i.weightBand) return false;
  if (when.noPlateToTransfer !== undefined && when.noPlateToTransfer !== i.noPlateToTransfer) return false;
  if (when.vehicleAge !== undefined && !(Array.isArray(when.vehicleAge) ? when.vehicleAge : [when.vehicleAge]).includes(i.vehicleAge)) return false;
  if (when.priceAtLeast !== undefined && i.price < when.priceAtLeast) return false;
  if (when.anyOf !== undefined && !when.anyOf.some((w) => matches(w, i))) return false;
  return true;
}

export function calculate(state: StateData, i: Inputs): Result {
  const lines: Line[] = [];
  const excluded: Result["excluded"] = [];
  const st = state.salesTax;

  // --- Sales / use tax ---------------------------------------------------
  const rate = st.stateRatePct;
  const trade = st.tradeInReducesBase;

  if (rate.value === null || !isUsable(rate.status)) {
    excluded.push({ label: "Sales tax", reason: "State rate not yet verified from an official source." });
  } else {
    const reduces = trade.value === true && isUsable(trade.status);
    if (trade.value === null || !isUsable(trade.status)) {
      excluded.push({ label: "Trade-in credit", reason: "Trade-in rule not yet verified; no credit applied." });
    }
    const base = Math.max(0, i.price - (reduces ? Math.min(i.tradeIn, st.tradeInCap ?? Infinity) : 0));
    const hr = st.higherRate;
    const overThreshold = !!hr && !!hr.value && i.price > hr.value.overPrice;
    const useHigher = overThreshold && isUsable(hr!.status);
    if (overThreshold && !useHigher) {
      excluded.push({ label: "Higher sales tax rate", reason: `A higher rate applies above $${hr!.value!.overPrice.toLocaleString("en-US")}, but it is not yet verified, so the standard rate is used.` });
    }
    const rateNow = useHigher ? hr!.value!.ratePct : rate.value;
    const rawTax = round2((base * rateNow) / 100);
    const stateTax = st.maxTax != null ? Math.min(rawTax, st.maxTax) : rawTax;
    if (rateNow > 0) {
      const capText = st.maxTax != null ? `, up to $${st.maxTax.toLocaleString("en-US")}` : "";
      lines.push({ id: "state-tax", label: `${state.name} ${st.taxName ?? "sales tax"} (${rateNow}%${capText})`, amount: stateTax, status: useHigher ? hr!.status : rate.status, note: useHigher ? hr!.note : rate.note });
    }

    const local = st.local;
    let localTax = 0;
    if (local.value && local.value.mode === "user-entered" && isUsable(local.status)) {
      const localBase = local.value.capBase !== null ? Math.min(base, local.value.capBase) : base;
      const over = i.localOverAmount ?? 0;
      const tiered = over > 0 && i.localOverRatePct !== undefined;
      if (tiered) {
        const low = Math.min(localBase, over);
        localTax = round2((low * i.localRatePct) / 100 + ((localBase - low) * (i.localOverRatePct as number)) / 100);
      } else {
        localTax = round2((localBase * i.localRatePct) / 100);
      }
      if (i.localRatePct > 0 || (tiered && (i.localOverRatePct as number) > 0)) {
        const usdN = (n: number) => `$${n.toLocaleString("en-US")}`;
        const what = tiered
          ? `${i.localRatePct}% on the first ${usdN(over)}, ${i.localOverRatePct}% above`
          : `${i.localRatePct}%${local.value.capBase !== null ? ` on first ${usdN(local.value.capBase)}` : ""}`;
        lines.push({ id: "local-tax", label: `Local tax (${what})`, amount: localTax, status: local.status });
      }
    } else if (!local.value || !isUsable(local.status)) {
      excluded.push({ label: "Local tax", reason: "Local tax rule not yet verified." });
    }

    // Credit for tax paid to another state, never more than what is owed.
    if (i.outOfStateTaxPaid > 0) {
      if (st.outOfStateCredit.value === true && isUsable(st.outOfStateCredit.status)) {
        const credit = Math.min(i.outOfStateTaxPaid, stateTax + localTax);
        lines.push({ id: "oos-credit", label: "Credit for tax paid to another state", amount: -round2(credit), status: st.outOfStateCredit.status });
      } else {
        excluded.push({ label: "Out-of-state tax credit", reason: "Credit rule not yet verified; no credit applied." });
      }
    }
  }

  // Conditional use tax (Oregon).
  if (st.useTax && st.useTax.value) {
    const u = st.useTax.value;
    if (isUsable(st.useTax.status)) {
      if (u.requires === "outOfStateNewDealer" && i.outOfStateNewDealer) {
        const gross = round2((i.price * u.ratePct) / 100);
        let credit = 0;
        if (i.outOfStateTaxPaid > 0 && st.outOfStateCredit.value === true && isUsable(st.outOfStateCredit.status)) {
          credit = Math.min(i.outOfStateTaxPaid, gross);
        }
        lines.push({ id: "use-tax", label: u.label, amount: round2(gross - credit), status: st.useTax.status, note: st.useTax.note });
      }
    } else {
      excluded.push({ label: u.label, reason: "Not yet verified." });
    }
  }

  // --- Fees --------------------------------------------------------------
  for (const fee of state.fees as Fee[]) {
    if (!matches(fee.when, i)) continue;
    const a = fee.amount;
    if (fee.kind === "weightTable" || fee.kind === "valueTable") {
      const key = fee.kind === "weightTable" ? i.weightLbs : i.price;
      const row = (fee.weightTable ?? []).find((r) => r.upTo === null || key <= r.upTo);
      if (!row || !isUsable(a.status)) {
        excluded.push({ label: fee.label, reason: fee.excludedReason ?? "Not yet verified from an official source." });
        continue;
      }
      const amt = i.fuel === "ev" && fee.minForEv !== undefined ? Math.max(row.fee, fee.minForEv) : row.fee;
      lines.push({ id: fee.id, label: fee.label, amount: amt, status: a.status, note: a.note });
      continue;
    }
    if (a.value === null || !isUsable(a.status)) {
      excluded.push({
        label: fee.label,
        reason: fee.excludedReason ?? (a.status === "conflict" ? "Official pages disagree; held back until resolved." : "Not yet verified from an official source."),
      });
      continue;
    }
    const alt = fee.altCounties && i.county && fee.altCounties.counties.includes(i.county) ? fee.altCounties.amount : null;
    const amount = fee.kind === "percentOfValue" ? round2((i.price * a.value) / 100) : alt ?? a.value;
    lines.push({ id: fee.id, label: fee.label, amount, status: a.status, note: a.note });
  }

  if (state.counties) {
    const c = state.counties;
    const table = c.fees.value;
    if (!table || !isUsable(c.fees.status)) {
      excluded.push({ label: c.label, reason: "County amounts not yet verified." });
    } else if (!i.county) {
      excluded.push({ label: c.label, reason: "Choose your county to include this fee." });
    } else if (table[i.county] === undefined) {
      excluded.push({ label: c.label, reason: `No amount listed for ${i.county}.` });
    } else {
      const heavy = c.heavyFees && c.heavyOverLbs !== undefined && i.weightLbs > c.heavyOverLbs ? c.heavyFees[i.county] : undefined;
      const place = i.county.includes(" (") ? i.county.split(" (")[0] : `${i.county} County`;
      lines.push({ id: "county-fee", label: `${c.label} (${place})`, amount: heavy ?? table[i.county], status: c.fees.status, note: c.fees.note });
    }
  }

  const total = round2(lines.reduce((s, l) => s + l.amount, 0));
  return { lines, total, excluded };
}

/** A state page may be indexed only when its core numbers are usable. */
export function publishability(state: StateData): { publishable: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const st = state.salesTax;
  if (st.stateRatePct.value === null || !isUsable(st.stateRatePct.status)) reasons.push("state tax rate not verified");
  if (st.tradeInReducesBase.value === null || !isUsable(st.tradeInReducesBase.status)) reasons.push("trade-in rule not verified");
  if (!isUsable(st.local.status)) reasons.push("local tax rule not verified");
  const usableFee = (prefix: string) =>
    state.fees.some((f) => f.id.startsWith(prefix) && f.amount.value !== null && isUsable(f.amount.status));
  if (!usableFee("title")) reasons.push("no verified title fee");
  if (!usableFee("registration")) reasons.push("no verified registration fee");
  return { publishable: reasons.length === 0, reasons };
}
