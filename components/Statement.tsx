import type { ReactNode } from "react";
import { usd } from "@/lib/format";
import type { Line, Result } from "@/lib/types";

/** Superscript footnote numbers. They link to the matching row of the sources table when `link` is set. */
function Fn({ nums, link }: { nums: number[] | undefined; link: boolean }) {
  if (!nums || nums.length === 0) return null;
  return (
    <sup className="fn">
      {nums.map((n) =>
        link ? (
          <a key={n} href={`#s${n}`}>
            [{n}]<span className="sr-only"> source</span>
          </a>
        ) : (
          <span key={n}>[{n}]</span>
        ),
      )}
    </sup>
  );
}

export interface StatementProps {
  /** Left side of the header strip, for example "Estimate / Travis County, Texas". */
  title: string;
  /** Right side of the header strip. */
  aside?: string;
  lines: Line[];
  /** Footnote numbers by line id, from footnotes() in lib/sources.ts. */
  footnoteNumbers: Record<string, number[]>;
  /** False where there is no sources table to link to (the home page sample). */
  linkFootnotes?: boolean;
  total: number;
  totalLabel?: string;
  /** The sentence under the total, for example the price plus these items. */
  plus?: ReactNode;
  excluded?: Result["excluded"];
  compact?: boolean;
  /** Announce changes to screen readers. On for the calculator, off for static samples. */
  live?: boolean;
  emptyText?: string;
}

/** The result as an itemized statement: ruled lines, dotted leaders, footnotes, double rule, total. */
export default function Statement({
  title, aside, lines, footnoteNumbers, linkFootnotes = true, total, totalLabel = "Total taxes and fees",
  plus, excluded = [], compact = false, live = false, emptyText = "Nothing could be priced from confirmed sources yet.",
}: StatementProps) {
  return (
    <section className={compact ? "stmt stmt--compact" : "stmt"} aria-live={live ? "polite" : undefined} aria-label={title}>
      <div className="stmt__head">
        <h2>{title}</h2>
        {aside && <p className="stmt__muted">{aside}</p>}
      </div>

      <ul className="stmt__lines">
        {lines.map((l) => (
          <li key={l.id} className="line">
            <span className="line__label">
              {l.label}
              <Fn nums={footnoteNumbers[l.id]} link={linkFootnotes} />
              {l.status === "partial" && <span className="line__flag">Check source</span>}
              {l.status === "partial" && l.note && <small className="line__note">{l.note}</small>}
            </span>
            <span className="line__leader" aria-hidden="true" />
            <b className="line__amt">{usd(l.amount)}</b>
          </li>
        ))}
        {lines.length === 0 && <li className="line line--empty">{emptyText}</li>}
      </ul>

      <div className="stmt__total">
        <span className="stmt__total-label">{totalLabel}</span>
        <span className="stmt__total-amt">{usd(total)}</span>
      </div>
      {excluded.length > 0 && (
        <p className="stmt__warn">
          <b>Not the full cost.</b> This total leaves out {excluded.length === 1 ? "1 item" : `${excluded.length} items`}, listed below.
        </p>
      )}
      {plus && <p className="stmt__plus">{plus}</p>}

      {excluded.length > 0 && (
        <div className="stmt__excl">
          <h3>Costs not in this total</h3>
          <ul>
            {excluded.map((e) => (
              <li key={e.label}>
                <b>{e.label}.</b> {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
