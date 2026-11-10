"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import AdSlot from "@/components/AdSlot";
import SourcesTable from "@/components/SourcesTable";
import Statement from "@/components/Statement";
import { formatDate, usd } from "@/lib/format";
import { calculateLlc, clampYears, DEFAULT_YEARS, MAX_YEARS, MIN_YEARS } from "@/lib/llc-calc";
import { llcFootnotes } from "@/lib/llc-sources";
import type { LlcState } from "@/lib/llc-types";

const YEAR_OPTIONS = Array.from({ length: MAX_YEARS - MIN_YEARS + 1 }, (_, n) => MIN_YEARS + n);

/** The LLC cost calculator for one state: years to estimate in, an itemized statement and sources table out. */
export default function LlcCalculator({ state, children }: { state: LlcState; children?: ReactNode }) {
  const [years, setYears] = useState(DEFAULT_YEARS);
  const id = useId();
  const result = useMemo(() => calculateLlc(state, years), [state, years]);
  const notes = useMemo(() => llcFootnotes(state, result.lines.map((l) => l.id)), [state, result]);

  const yearly = [
    result.yearlyTotal > 0 ? `${usd(result.yearlyTotal)} each year` : null,
    result.biennialTotal > 0 ? `${usd(result.biennialTotal)} every two years` : null,
  ].filter(Boolean).join(" and ");

  return (
    <>
      <div className="workbench">
        <form className="form" onSubmit={(e) => e.preventDefault()} aria-labelledby={`${id}-title`}>
          <div className="form__head">
            <h2 id={`${id}-title`}>Your LLC</h2>
            <span>{state.name}</span>
          </div>
          <div className="form__body">
            <fieldset>
              <legend>Period</legend>
              <div className="field">
                <label htmlFor={`${id}-years`}>Years to estimate</label>
                <select id={`${id}-years`} value={years} onChange={(e) => setYears(clampYears(Number(e.target.value)))} aria-describedby={`${id}-hint`}>
                  {YEAR_OPTIONS.map((n) => <option key={n} value={n}>{n === 1 ? "1 year" : `${n} years`}</option>)}
                </select>
                <span id={`${id}-hint`} className="hint">Year 1 is the year you form the LLC. A fee first due later, or only every second year, is counted only when it falls in this period.</span>
              </div>
            </fieldset>
            <p className="form__note">
              Estimate of state fees for a domestic LLC. Not legal or tax advice. Federal and state income taxes are not included.
              Confirm every amount with the {state.name} agency before you file.
            </p>
          </div>
        </form>

        <div className="result-col">
          <Statement
            live
            title={`Estimate / ${state.name} LLC`}
            aside={`Reviewed ${formatDate(state.lastReviewed)}`}
            lines={result.lines}
            footnoteNumbers={notes.byLine}
            total={result.total}
            totalLabel={`Total over ${result.years === 1 ? "1 year" : `${result.years} years`}`}
            plus={<>One time to form: <b>{usd(result.formationTotal)}</b>.{yearly && <> To keep it: <b>{yearly}</b>.</>}</>}
            excluded={result.excluded}
            emptyText="No fee could be priced from confirmed sources yet."
          />
          <p className="result-meta">
            <span>Estimate for the first {result.years === 1 ? "year" : `${result.years} years`}.</span>
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
