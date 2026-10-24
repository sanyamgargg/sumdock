"use client";

import { useMemo, useState } from "react";
import { calculate } from "@/lib/calc";
import type { Inputs, StateData } from "@/lib/types";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function Calculator({ state }: { state: StateData }) {
  const [i, setI] = useState<Inputs>({
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
  });
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setI((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v)));
  const result = useMemo(() => calculate(state, i), [state, i]);
  const local = state.salesTax.local.value;
  const hasMpg = state.fees.some((f) => f.when?.mpgBand);
  const hasWeight = state.fees.some((f) => f.when?.weightBand);
  const counties = state.counties?.fees.value ? Object.keys(state.counties.fees.value).sort() : [];
  const hasWeightTable = state.fees.some((f) => f.kind === "weightTable");
  const hasPlate = state.fees.some((f) => f.when?.noPlateToTransfer !== undefined);

  return (
    <div className="calc">
      <form onSubmit={(e) => e.preventDefault()} className="grid">
        <label>Vehicle price ($)
          <input type="number" inputMode="decimal" min="0" value={i.price} onChange={(e) => set("price", num(e.target.value))} />
        </label>
        <label>Trade-in value ($)
          <input type="number" inputMode="decimal" min="0" value={i.tradeIn} onChange={(e) => set("tradeIn", num(e.target.value))} />
        </label>
        {local && local.mode === "user-entered" && (
          <label>Local tax rate (%)
            <input type="number" inputMode="decimal" min="0" step="0.01" value={i.localRatePct} onChange={(e) => set("localRatePct", num(e.target.value))} />
            {local.rangeNote && <small>{local.rangeNote}</small>}
          </label>
        )}
        <label>Tax already paid to another state ($)
          <input type="number" inputMode="decimal" min="0" value={i.outOfStateTaxPaid} onChange={(e) => set("outOfStateTaxPaid", num(e.target.value))} />
        </label>
        <label>Fuel type
          <select value={i.fuel} onChange={(e) => set("fuel", e.target.value as Inputs["fuel"])}>
            <option value="gas">Gas / hybrid</option>
            <option value="ev">Electric</option>
          </select>
        </label>
        {hasMpg && i.fuel === "gas" && (
          <label>Fuel economy
            <select value={i.mpgBand} onChange={(e) => set("mpgBand", e.target.value as Inputs["mpgBand"])}>
              <option value="0-19">0-19 MPG</option>
              <option value="20-39">20-39 MPG</option>
              <option value="40+">40+ MPG</option>
            </select>
          </label>
        )}
        {hasWeight && (
          <label>Vehicle weight
            <select value={i.weightBand} onChange={(e) => set("weightBand", e.target.value as Inputs["weightBand"])}>
              <option value="light">Under 2,500 lbs</option>
              <option value="mid">2,500-3,499 lbs</option>
              <option value="heavy">3,500 lbs and up</option>
            </select>
          </label>
        )}
        {counties.length > 0 && (
          <label>County
            <select value={i.county} onChange={(e) => set("county", e.target.value)}>
              <option value="">Choose your county</option>
              {counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        {hasWeightTable && (
          <label>Vehicle weight (lbs)
            <input type="number" inputMode="numeric" min="0" value={i.weightLbs} onChange={(e) => set("weightLbs", num(e.target.value))} />
            <small>Curb weight from the registration or manufacturer sticker.</small>
          </label>
        )}
        {hasPlate && (
          <label className="check">
            <input type="checkbox" checked={i.noPlateToTransfer} onChange={(e) => set("noPlateToTransfer", e.target.checked)} />
            No existing plate to transfer
          </label>
        )}
        {state.salesTax.useTax && (
          <label className="check">
            <input type="checkbox" checked={i.outOfStateNewDealer} onChange={(e) => set("outOfStateNewDealer", e.target.checked)} />
            New vehicle bought from a dealer outside {state.name}
          </label>
        )}
      </form>

      <section className="result" aria-live="polite">
        <h3>Estimated taxes and fees</h3>
        <table>
          <tbody>
            {result.lines.map((l) => (
              <tr key={l.id}>
                <td>{l.label}{l.status === "partial" && <span className="tag" title={l.note}>check source</span>}</td>
                <td className="num">{usd(l.amount)}</td>
              </tr>
            ))}
            <tr className="total">
              <td>Estimated total (excluding price)</td>
              <td className="num">{usd(result.total)}</td>
            </tr>
          </tbody>
        </table>
        {result.excluded.length > 0 && (
          <div className="excluded">
            <strong>Not included, still being verified:</strong>
            <ul>
              {result.excluded.map((e) => (
                <li key={e.label}>{e.label}: {e.reason}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
