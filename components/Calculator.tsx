"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import AdSlot from "@/components/AdSlot";
import SourcesTable from "@/components/SourcesTable";
import Statement from "@/components/Statement";
import { calculate } from "@/lib/calc";
import { DEFAULT_INPUTS } from "@/lib/content";
import { formatDate, groupNumber, parseNumber, usd, usdShort } from "@/lib/format";
import { footnotes } from "@/lib/sources";
import type { FeeWhen, Inputs, StateData } from "@/lib/types";

/** Text field for dollars or percents. Shows "30,000" but keeps a number in state. */
function NumberField({
  label, value, onValue, prefix, suffix, hint, warn = false, decimals = 2, mode = "decimal",
}: {
  label: string; value: number; onValue: (n: number) => void;
  prefix?: string; suffix?: string; hint?: string; warn?: boolean; decimals?: number; mode?: "decimal" | "numeric";
}) {
  const id = useId();
  const [text, setText] = useState(groupNumber(value, decimals));
  // Follow outside changes (the county picker fills the local rate) without fighting the user's typing.
  useEffect(() => {
    setText((t) => (parseNumber(t) === value ? t : groupNumber(value, decimals)));
  }, [value, decimals]);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <span className="input-wrap">
        {prefix && <span className="input-wrap__affix" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode={mode}
          autoComplete="off"
          value={text}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            onValue(parseNumber(e.target.value));
          }}
          onBlur={() => setText(groupNumber(parseNumber(text), decimals))}
        />
        {suffix && <span className="input-wrap__affix" aria-hidden="true">{suffix}</span>}
      </span>
      {hint && <span id={`${id}-hint`} className={warn ? "hint hint--warn" : "hint"}>{hint}</span>}
    </div>
  );
}

function SelectField({
  label, value, onChange, hint, children,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined}>
        {children}
      </select>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="check">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

/**
 * The purchase form, the statement it produces, and the sources table behind it. They live together because the
 * footnote numbers depend on which lines the statement currently shows. `children` render under the sources table.
 */
export default function Calculator({ state, children }: { state: StateData; children?: ReactNode }) {
  const [i, setI] = useState<Inputs>(DEFAULT_INPUTS);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setI((p) => ({ ...p, [k]: v }));
  const result = useMemo(() => calculate(state, i), [state, i]);
  const notes = useMemo(() => footnotes(state, result.lines.map((l) => l.id)), [state, result]);
  const local = state.salesTax.local.value;
  const hasMpg = state.fees.some((f) => f.when?.mpgBand);
  const hasWeight = state.fees.some((f) => f.when?.weightBand);
  const counties = state.counties?.fees.value ? Object.keys(state.counties.fees.value).sort() : [];
  const rateTable = state.localRates?.rates.value ?? null;
  const rateCounties = rateTable ? Object.keys(rateTable).sort() : [];
  const [rateCounty, setRateCounty] = useState("");
  const [ratePlace, setRatePlace] = useState("");
  // True once the person types their own local rate, so the hint can say the value is no longer auto-filled.
  const [rateEdited, setRateEdited] = useState(false);
  const stateRate = state.salesTax.stateRatePct.value ?? 0;
  const applyRate = (county: string, place: string) => {
    setRateCounty(county);
    setRatePlace(place);
    setRateEdited(false);
    // When one picker drives both the tax rate and a county fee table (New York), keep them in step.
    if (state.counties) set("county", county);
    const entry = rateTable?.[county];
    if (!entry) return;
    const offset0 = state.localRates?.mode === "localOnly" ? 0 : stateRate;
    const tier = place ? entry.tiers?.[place] : undefined;
    set("localOverAmount", tier ? tier.over : 0);
    set("localOverRatePct", tier ? Math.max(0, Math.round((tier.rate - offset0) * 1000) / 1000) : 0);
    const combined = place && entry.places[place] !== undefined ? entry.places[place] : entry.county;
    const offset = state.localRates?.mode === "localOnly" ? 0 : stateRate;
    set("localRatePct", Math.max(0, Math.round((combined - offset) * 1000) / 1000));
  };
  const hasWeightTable = state.fees.some((f) => f.kind === "weightTable");
  const whenUsesAge = (w?: FeeWhen): boolean => !!w && (w.vehicleAge !== undefined || (w.anyOf ?? []).some(whenUsesAge));
  const usesAge = state.fees.some((f) => whenUsesAge(f.when));
  const hasPlate = state.fees.some((f) => f.when?.noPlateToTransfer !== undefined);
  const showLocalRate = !!local && local.mode === "user-entered";
  const hasLocation = !!rateTable || counties.length > 0 || showLocalRate;

  const countyName = (c: string) => (c ? `${c} County` : "");
  const placeLabel = rateTable
    ? [ratePlace === rateCounty ? "" : ratePlace, countyName(rateCounty)].filter(Boolean).join(", ")
    : countyName(i.county);
  const hasTrade = i.tradeIn > 0;
  const costLabel = hasTrade ? "Price after trade-in, plus these items" : "Price plus these items";
  const cost = Math.max(0, i.price - i.tradeIn) + result.total;
  const tradeWarning = i.tradeIn > i.price ? "This trade-in is more than the vehicle price, so the amount left to tax is zero." : undefined;
  const rateHint = [
    rateTable && rateCounty && !rateEdited ? "Filled in from your county or city. Type a different rate to override it." : null,
    rateTable && !rateEdited && (i.localOverAmount ?? 0) > 0 ? `The rate drops to ${i.localOverRatePct}% on the part of the price above $${(i.localOverAmount ?? 0).toLocaleString("en-US")}.` : null,
    rateTable && rateEdited ? "You changed this rate. Choose your county again to reset it." : null,
    local?.rangeNote ?? null,
  ].filter(Boolean).join(" ") || undefined;
  const countyHint = state.counties ? `The ${state.counties.label.toLowerCase()} is added for the county you choose.` : undefined;

  return (
    <>
      <div className="workbench">
        <form className="form" onSubmit={(e) => e.preventDefault()} aria-labelledby="form-title">
          <div className="form__head">
            <h2 id="form-title">Your purchase</h2>
            <span>{state.name}</span>
          </div>
          <div className="form__body">
            <fieldset>
              <legend>Price</legend>
              <div className="field-row">
                <NumberField label="Vehicle price" prefix="$" value={i.price} onValue={(n) => set("price", n)} />
                <NumberField label="Trade-in value" prefix="$" value={i.tradeIn} onValue={(n) => set("tradeIn", n)} hint={tradeWarning} warn />
              </div>
              <NumberField label="Tax already paid to another state" prefix="$" value={i.outOfStateTaxPaid} onValue={(n) => set("outOfStateTaxPaid", n)} />
              {state.salesTax.useTax && (
                <CheckField
                  label={`New vehicle bought from a dealer outside ${state.name}`}
                  checked={i.outOfStateNewDealer}
                  onChange={(v) => set("outOfStateNewDealer", v)}
                />
              )}
            </fieldset>

            {hasLocation && (
              <fieldset>
                <legend>Where you live</legend>
                {rateTable && (
                  <>
                    <SelectField
                      label={`County${state.counties ? "" : state.localRates?.mode === "localOnly" ? " (for surtax rate)" : " (for local tax rate)"}`}
                      value={rateCounty}
                      onChange={(v) => applyRate(v, "")}
                      hint="Choose your county first. If it lists cities or areas, a second menu appears so you can pick yours. The local rate then fills in below."
                    >
                      <option value="">Choose your county</option>
                      {rateCounties.map((n) => <option key={n} value={n}>{n}</option>)}
                    </SelectField>
                    {rateCounty && Object.keys(rateTable[rateCounty].places).length > 0 && (
                      <SelectField
                        label="City or area"
                        value={ratePlace}
                        onChange={(v) => applyRate(rateCounty, v)}
                        hint="The local rate below updates when you pick one."
                      >
                        <option value="">Not listed / county rate ({rateTable[rateCounty].county}% combined)</option>
                        {Object.keys(rateTable[rateCounty].places).sort().map((p) => (
                          <option key={p} value={p}>{p} ({rateTable[rateCounty].places[p]}%{rateTable[rateCounty].tiers?.[p] ? `, ${rateTable[rateCounty].tiers![p].rate}% above $${rateTable[rateCounty].tiers![p].over.toLocaleString("en-US")}` : ""})</option>
                        ))}
                      </SelectField>
                    )}
                  </>
                )}
                {counties.length > 0 && !rateTable && (
                  <SelectField label="County of residence" value={i.county} onChange={(v) => set("county", v)} hint={countyHint}>
                    <option value="">Choose your county</option>
                    {counties.map((c) => <option key={c} value={c}>{c}</option>)}
                  </SelectField>
                )}
                {showLocalRate && local && (
                  <NumberField
                    label="Local tax rate"
                    suffix="%"
                    decimals={3}
                    value={i.localRatePct}
                    onValue={(n) => { setRateEdited(true); set("localRatePct", n); set("localOverAmount", 0); }}
                    hint={rateHint}
                  />
                )}
              </fieldset>
            )}

            <fieldset>
              <legend>Vehicle</legend>
              <div className="field">
                <span className="field__label" id="fuel-label">Fuel</span>
                <div className="seg" role="group" aria-labelledby="fuel-label">
                  <button type="button" aria-pressed={i.fuel === "gas"} onClick={() => set("fuel", "gas")}>Gas / hybrid</button>
                  <button type="button" aria-pressed={i.fuel === "ev"} onClick={() => set("fuel", "ev")}>Electric</button>
                </div>
              </div>
              {usesAge && (
                <SelectField label="New or used" value={i.vehicleAge} onChange={(v) => set("vehicleAge", v as Inputs["vehicleAge"])}>
                  <option value="new">New, bought from a dealer</option>
                  <option value="recent">Used, model year within the last 2 years</option>
                  <option value="older">Used, older model year</option>
                </SelectField>
              )}
              {hasMpg && i.fuel === "gas" && (
                <SelectField label="Fuel economy" value={i.mpgBand} onChange={(v) => set("mpgBand", v as Inputs["mpgBand"])}>
                  <option value="0-19">0-19 MPG</option>
                  <option value="20-39">20-39 MPG</option>
                  <option value="40+">40+ MPG</option>
                </SelectField>
              )}
              {hasWeight && (
                <SelectField label="Vehicle weight" value={i.weightBand} onChange={(v) => set("weightBand", v as Inputs["weightBand"])}>
                  <option value="light">Under 2,500 lbs</option>
                  <option value="mid">2,500-3,499 lbs</option>
                  <option value="heavy">3,500 lbs and up</option>
                </SelectField>
              )}
              {hasWeightTable && (
                <NumberField
                  label="Vehicle weight (lbs)"
                  suffix="lbs"
                  decimals={0}
                  mode="numeric"
                  value={i.weightLbs}
                  onValue={(n) => set("weightLbs", n)}
                  hint="Curb weight from the registration or manufacturer sticker."
                />
              )}
              {hasPlate && (
                <CheckField label="No existing plate to transfer" checked={i.noPlateToTransfer} onChange={(v) => set("noPlateToTransfer", v)} />
              )}
            </fieldset>

            <p className="form__note">
              Estimate only. Not tax or legal advice. Confirm with your {state.name} state agency before you pay.
            </p>
          </div>
        </form>

        <div className="result-col">
          <Statement
            live
            title={`Estimate / ${placeLabel ? `${placeLabel}, ` : ""}${state.name}`}
            aside={`Reviewed ${formatDate(state.lastReviewed)}`}
            lines={result.lines}
            footnoteNumbers={notes.byLine}
            total={result.total}
            plus={<>{costLabel}: <b>{usd(cost)}</b>.</>}
            excluded={result.excluded}
          />
          <p className="result-meta">
            <span>Estimate for a {usdShort(i.price)} vehicle.</span>
            <a href="#sources">See all sources</a>
          </p>
          <AdSlot name="below-result" minHeight={250} />
        </div>
      </div>

      <SourcesTable items={notes.ordered} />
      {children}
    </>
  );
}
