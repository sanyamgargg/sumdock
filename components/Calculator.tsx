"use client";

import { useEffect, useId, useMemo, useState } from "react";
import AdSlot from "@/components/AdSlot";
import { calculate } from "@/lib/calc";
import { DEFAULT_INPUTS } from "@/lib/content";
import { formatDate, groupNumber, parseNumber, usd, usdShort } from "@/lib/format";
import { shortTitle, sourcesForLine } from "@/lib/sources";
import type { Inputs, StateData } from "@/lib/types";

/** Text field for dollars or percents. Shows "30,000" but keeps a number in state. */
function NumberField({
  label, value, onValue, prefix, suffix, hint, decimals = 2, mode = "decimal",
}: {
  label: string; value: number; onValue: (n: number) => void;
  prefix?: string; suffix?: string; hint?: string; decimals?: number; mode?: "decimal" | "numeric";
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
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

function SelectField({
  label, value, onChange, hint, children,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined}>
        {children}
      </select>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
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

export default function Calculator({ state }: { state: StateData }) {
  const [i, setI] = useState<Inputs>(DEFAULT_INPUTS);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setI((p) => ({ ...p, [k]: v }));
  const result = useMemo(() => calculate(state, i), [state, i]);
  const local = state.salesTax.local.value;
  const hasMpg = state.fees.some((f) => f.when?.mpgBand);
  const hasWeight = state.fees.some((f) => f.when?.weightBand);
  const counties = state.counties?.fees.value ? Object.keys(state.counties.fees.value).sort() : [];
  const rateTable = state.localRates?.rates.value ?? null;
  const rateCounties = rateTable ? Object.keys(rateTable).sort() : [];
  const [rateCounty, setRateCounty] = useState("");
  const [ratePlace, setRatePlace] = useState("");
  const stateRate = state.salesTax.stateRatePct.value ?? 0;
  const applyRate = (county: string, place: string) => {
    setRateCounty(county);
    setRatePlace(place);
    // When one picker drives both the tax rate and a county fee table (New York), keep them in step.
    if (state.counties) set("county", county);
    const entry = rateTable?.[county];
    if (!entry) return;
    const combined = place && entry.places[place] !== undefined ? entry.places[place] : entry.county;
    const offset = state.localRates?.mode === "localOnly" ? 0 : stateRate;
    set("localRatePct", Math.max(0, Math.round((combined - offset) * 1000) / 1000));
  };
  const hasWeightTable = state.fees.some((f) => f.kind === "weightTable");
  const hasPlate = state.fees.some((f) => f.when?.noPlateToTransfer !== undefined);
  const showLocalRate = !!local && local.mode === "user-entered";
  const hasLocation = !!rateTable || counties.length > 0 || showLocalRate;

  const countyName = (c: string) => (c ? `${c} County` : "");
  const placeLabel = rateTable
    ? [ratePlace, countyName(rateCounty)].filter(Boolean).join(", ")
    : countyName(i.county);
  const subtitle = `on a ${usdShort(i.price)} vehicle${placeLabel ? ` in ${placeLabel}` : ""}. Price plus these items comes to ${usd(i.price + result.total)}.`;
  const countyHint = state.counties ? `The ${state.counties.label.toLowerCase()} is added for the county you choose.` : undefined;

  return (
    <div className="calc-layout">
      <form className="card calc-form" onSubmit={(e) => e.preventDefault()} aria-labelledby="form-title">
        <h2 id="form-title" className="calc-form__title">Your purchase</h2>
        <fieldset>
          <legend>Price</legend>
          <div className="field-row">
            <NumberField label="Vehicle price" prefix="$" value={i.price} onValue={(n) => set("price", n)} />
            <NumberField label="Trade-in value" prefix="$" value={i.tradeIn} onValue={(n) => set("tradeIn", n)} />
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
                >
                  <option value="">Choose your county</option>
                  {rateCounties.map((n) => <option key={n} value={n}>{n}</option>)}
                </SelectField>
                {rateCounty && Object.keys(rateTable[rateCounty].places).length > 0 && (
                  <SelectField
                    label="City or area"
                    value={ratePlace}
                    onChange={(v) => applyRate(rateCounty, v)}
                    hint="Pick the city or area where you live. You can still edit the local rate below."
                  >
                    <option value="">Not listed / county rate ({rateTable[rateCounty].county}% combined)</option>
                    {Object.keys(rateTable[rateCounty].places).sort().map((p) => (
                      <option key={p} value={p}>{p} ({rateTable[rateCounty].places[p]}% combined)</option>
                    ))}
                  </SelectField>
                )}
              </>
            )}
            {counties.length > 0 && !rateTable && (
              <SelectField label="County" value={i.county} onChange={(v) => set("county", v)} hint={countyHint}>
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
                onValue={(n) => set("localRatePct", n)}
                hint={local.rangeNote ?? undefined}
              />
            )}
          </fieldset>
        )}

        <fieldset>
          <legend>Vehicle</legend>
          <div className="field">
            <span className="field__label" id="fuel-label">Fuel type</span>
            <div className="segmented" role="group" aria-labelledby="fuel-label">
              <button type="button" aria-pressed={i.fuel === "gas"} onClick={() => set("fuel", "gas")}>Gas / hybrid</button>
              <button type="button" aria-pressed={i.fuel === "ev"} onClick={() => set("fuel", "ev")}>Electric</button>
            </div>
          </div>
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

        <p className="calc-form__note">
          Estimate only. Not tax or legal advice. Confirm with your {state.name} state agency before you pay.
        </p>
      </form>

      <div className="result-col">
        <section className="card result-card" aria-labelledby="result-title" aria-live="polite">
          <div className="result-card__head">
            <h2 id="result-title" className="result-card__title">Estimated taxes and fees</h2>
            <div className="result-card__total">{usd(result.total)}</div>
            <div className="result-card__sub">{subtitle}</div>
          </div>

          <div className="lines-wrap">
            <div className="lines-head" aria-hidden="true">
              <span>Item</span><span>Source</span><span>Amount</span>
            </div>
            <ul className="lines">
              {result.lines.map((l) => {
                const src = sourcesForLine(state, l.id)[0];
                return (
                  <li key={l.id} className="line">
                    <span className="line__label">
                      {l.label}
                      {l.status === "partial" && <span className="tag">check source</span>}
                    </span>
                    {src ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="line__src" title={src.title}>
                        {shortTitle(src.title)}
                      </a>
                    ) : (
                      <span className="line__src" />
                    )}
                    <b className="line__amt">{usd(l.amount)}</b>
                    {l.status === "partial" && l.note && <small className="line__note">{l.note}</small>}
                  </li>
                );
              })}
              {result.lines.length === 0 && <li className="line line--empty">Nothing could be priced from confirmed sources yet.</li>}
              <li className="line line--total">
                <span className="line__label">Total</span>
                <span className="line__src" />
                <b className="line__amt">{usd(result.total)}</b>
              </li>
            </ul>
          </div>

          {result.excluded.length > 0 && (
            <div className="excluded">
              <b>Not included yet</b>
              <ul>
                {result.excluded.map((e) => (
                  <li key={e.label}><b>{e.label}.</b> {e.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="result-meta">
          <span>Last checked {formatDate(state.lastReviewed)}</span>
          <a href="#sources">See all sources</a>
        </div>
        <AdSlot name="below-result" minHeight={250} />
      </div>
    </div>
  );
}
