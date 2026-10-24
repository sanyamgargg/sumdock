"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";
import StatusMark from "@/components/StatusMark";
import type { Verification } from "@/lib/content";

export interface StateRow {
  slug: string;
  name: string;
  code: string;
  /** One line about the main tax, built from the data file on the server. */
  tax: string;
  status: Verification;
  statusLabel: string;
  /** Already formatted, for example "Oct 24, 2026". */
  reviewed: string;
}

/** Lowercase words separated by single spaces, so "New-York" and "new  york" compare the same. */
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * A state matches when what was typed starts the name or any word in it ("york" finds New York, "ca" finds
 * California but not North Carolina), or when it is the start of the two-letter code ("ny", "n").
 */
function matches(r: StateRow, q: string): boolean {
  const n = words(q);
  if (!n) return true;
  return ` ${words(r.name)}`.includes(` ${n}`) || r.code.toLowerCase().startsWith(n.replace(/ /g, ""));
}

/** The state list with a search field above it. */
export default function StateIndex({ rows }: { rows: StateRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const shown = useMemo(() => rows.filter((r) => matches(r, q)), [rows, q]);

  const open = (r: StateRow) => router.push(`/vehicle/${r.slug}/`);
  const submit = () => {
    // Enter jumps straight to the state when the search has narrowed to one page you can open.
    if (shown.length === 1 && shown[0].status !== "in-review") open(shown[0]);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && q) {
      e.preventDefault();
      setQ("");
    }
  };

  const status = !q
    ? `${rows.length} states`
    : shown.length === 0
      ? "No state matches."
      : `${shown.length} of ${rows.length} states`;

  return (
    <section aria-labelledby="states-title">
      <h2 id="states-title" className="sr-only">States</h2>

      <form
        className="find"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="state-search" className="find__label">Find your state</label>
        <div className="find__box">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="find__icon">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12.8 12.8L18 18" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <input
            id="state-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a state, like Texas or NY"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-describedby="find-status"
          />
          {q && (
            <button type="button" className="find__clear" aria-label="Clear search" onClick={() => setQ("")}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
          )}
        </div>
        <p id="find-status" className="find__status" aria-live="polite">{status}</p>
      </form>

      {shown.length === 0 ? (
        <div className="find__empty">
          <p>
            No state matches “{q.trim()}”. Try the full state name or its two-letter code. We cover {rows.length} states so
            far, and more are on the way.
          </p>
          <button type="button" className="btn btn--ghost" onClick={() => setQ("")}>Show all states</button>
        </div>
      ) : (
        <>
          <div className="states__head" aria-hidden="true">
            <span>State</span><span>Main tax</span><span>Data status</span><span>Reviewed</span><span />
          </div>
          <ul className="states">
            {shown.map((r) => {
              const review = r.status === "in-review";
              return (
                <li key={r.slug} className={review ? "state-row is-review" : "state-row"}>
                  <span className="state-row__name">{review ? r.name : <Link href={`/vehicle/${r.slug}/`}>{r.name}</Link>}</span>
                  <span className="state-row__tax">{r.tax}</span>
                  <span className="state-row__status"><StatusMark status={r.status} label={r.statusLabel} /></span>
                  <span className="state-row__date">{r.reviewed}</span>
                  <span className="state-row__go">
                    {!review && (
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" />
                      </svg>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ul className="legend" aria-label="What the status words mean">
        <li><StatusMark status="verified" label="Verified" />: every figure in the total is confirmed on an official page.</li>
        <li><StatusMark status="partial" label="Partly verified" />: some figures are marked “check source”.</li>
        <li><StatusMark status="in-review" label="In review" />: a core figure is not confirmed, so the page is not yet public.</li>
      </ul>
    </section>
  );
}
