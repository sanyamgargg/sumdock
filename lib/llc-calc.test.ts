import { describe, expect, it } from "vitest";
import { calculateLlc, clampYears, llcPublishability, occurrences } from "./llc-calc";
import { loadLlcState, loadLlcStates } from "./llc-data";
import type { LlcFee, LlcState } from "./llc-types";

const get = (slug: string) => loadLlcState(slug)!;

/**
 * Expected totals are worked by hand from the data files: formation + yearly x years + biennial x filings.
 * Totals per number of years, 1 to 5.
 */
const EXPECTED: Record<string, { publishable: boolean; formation: number; yearly: number; biennial: number; totals: number[] }> = {
  // $70 + $800 each year + $20 Statement of Information in years 1, 3 and 5.
  california: { publishable: true, formation: 70, yearly: 800, biennial: 20, totals: [890, 1690, 2510, 3310, 4130] },
  // $300 + a $0 franchise tax at or below the no-tax-due threshold.
  texas: { publishable: true, formation: 300, yearly: 0, biennial: 0, totals: [300, 300, 300, 300, 300] },
  // $200 + $50 at formation, $9 biennial statement first due in year 2 (years 2 and 4).
  "new-york": { publishable: true, formation: 250, yearly: 0, biennial: 9, totals: [250, 259, 259, 268, 268] },
  // $110 + $400 tax for each year.
  delaware: { publishable: true, formation: 110, yearly: 400, biennial: 0, totals: [510, 910, 1310, 1710, 2110] },
  // $100 filing fee only: the annual report fee is unverified, so it is left out and the page is not public.
  // $100 filing + $25 registered agent fee, $138.75 annual report from year 2 (Division of Corporations fee page).
  florida: { publishable: true, formation: 125, yearly: 138.75, biennial: 0, totals: [125, 263.75, 402.5, 541.25, 680] },
};

describe("LLC data set", () => {
  it("has the five launch states and no others", () => {
    expect(loadLlcStates().map((s) => s.slug).sort()).toEqual(Object.keys(EXPECTED).sort());
  });
});

describe.each(Object.entries(EXPECTED))("%s", (slug, want) => {
  const s = get(slug);

  it("publishability", () => {
    expect(llcPublishability(s).publishable).toBe(want.publishable);
  });

  it("formation, yearly and biennial totals", () => {
    const r = calculateLlc(s, 1);
    expect(r.formationTotal).toBe(want.formation);
    expect(r.yearlyTotal).toBe(want.yearly);
    expect(r.biennialTotal).toBe(want.biennial);
  });

  it("total over 1 to 5 years", () => {
    expect([1, 2, 3, 4, 5].map((y) => calculateLlc(s, y).total)).toEqual(want.totals);
  });

  it("statement lines add up to the total", () => {
    for (const y of [1, 2, 3, 4, 5]) {
      const r = calculateLlc(s, y);
      expect(Math.round(r.lines.reduce((t, l) => t + l.amount, 0) * 100) / 100).toBe(r.total);
    }
  });
});

describe("unverified items", () => {
  it("are excluded from the total and listed with a reason", () => {
    const s: LlcState = JSON.parse(JSON.stringify(get("florida")));
    s.annual[0].amount = { ...s.annual[0].amount, status: "unverified", value: null, note: "test" };
    const r = calculateLlc(s, 3);
    expect(r.lines.some((l) => l.id === "annual-report")).toBe(false);
    expect(r.excluded.find((e) => e.label === "Annual report fee")).toBeDefined();
  });

  it("are never counted, whatever their value", () => {
    const s: LlcState = JSON.parse(JSON.stringify(get("delaware")));
    s.annual[0].amount = { ...s.annual[0].amount, status: "unverified", value: null, note: "test" };
    const r = calculateLlc(s, 5);
    expect(r.total).toBe(110);
    expect(r.excluded.some((e) => e.label === s.annual[0].label)).toBe(true);
    expect(llcPublishability(s).publishable).toBe(false);
    expect(llcPublishability(s).reasons).toContain("main yearly fee not verified");
  });

  it("conflict is excluded too", () => {
    const s: LlcState = JSON.parse(JSON.stringify(get("delaware")));
    s.formation[0].amount = { ...s.formation[0].amount, status: "conflict", value: null, alt: [100, 110], note: "test" };
    const r = calculateLlc(s, 1);
    expect(r.formationTotal).toBe(0);
    expect(r.excluded.find((e) => e.label === s.formation[0].label)!.reason).toMatch(/disagree/i);
    expect(llcPublishability(s).reasons).toContain("formation filing fee not verified");
  });

  it("the other items in notIncluded are always listed", () => {
    for (const s of loadLlcStates()) {
      const r = calculateLlc(s, 1);
      for (const n of s.notIncluded) expect(r.excluded.map((e) => e.label)).toContain(n.label);
    }
  });
});

describe("how often a fee falls in the period", () => {
  const fee = (frequency: LlcFee["frequency"], firstYear?: number): LlcFee => ({
    id: "x", label: "X", frequency, firstYear, amount: { value: 10, status: "verified", sources: [] },
  });

  it("a one-time fee counts once", () => {
    for (const y of [1, 2, 3, 4, 5]) expect(occurrences(fee("once"), y)).toBe(1);
  });

  it("a biennial fee first due in year 1 falls in years 1, 3 and 5", () => {
    expect([1, 2, 3, 4, 5].map((y) => occurrences(fee("biennial"), y))).toEqual([1, 1, 2, 2, 3]);
  });

  it("a biennial fee first due in year 2 falls in years 2 and 4", () => {
    expect([1, 2, 3, 4, 5].map((y) => occurrences(fee("biennial", 2), y))).toEqual([0, 1, 1, 2, 2]);
  });

  it("an annual fee counts each year from its first year", () => {
    expect([1, 2, 3, 4, 5].map((y) => occurrences(fee("annual"), y))).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 5].map((y) => occurrences(fee("annual", 2), y))).toEqual([0, 1, 2, 3, 4]);
  });

  it("a fee not yet due still shows on the statement at zero, with the year it starts", () => {
    const ny = calculateLlc(get("new-york"), 1);
    const line = ny.lines.find((l) => l.id === "biennial-statement")!;
    expect(line.amount).toBe(0);
    expect(line.label).toContain("first due in year 2");
  });

  it("New York's biennial statement is verified from the Department of State fee schedule", () => {
    const fee = get("new-york").annual.find((f) => f.id === "biennial-statement")!;
    expect(fee.amount.status).toBe("verified");
    expect(fee.amount.value).toBe(9);
  });

  it("Texas cites the working Secretary of State address and says the information report is still due", () => {
    const tx = get("texas");
    expect(JSON.stringify(tx)).not.toContain("www.sos.texas.gov");
    expect(tx.annual.find((f) => f.id === "franchise-tax")!.amount.note).toContain("Public Information Report");
  });

  it("years are kept between 1 and 5", () => {
    expect([0, -3, 1, 3, 5, 9, 2.6, NaN].map(clampYears)).toEqual([1, 1, 1, 3, 5, 5, 3, 3]);
    expect(calculateLlc(get("delaware"), 99).years).toBe(5);
  });
});
