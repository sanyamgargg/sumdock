import { describe, expect, it } from "vitest";
import { calculate, localRateInputs } from "./calc";
import { countySpread, placeName, rankedPlaces, walkthrough, WALK } from "./examples";
import { loadStates } from "./data";

const states = loadStates();
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

describe.each(states.map((s) => [s.name, s] as const))("%s worked example", (_name, s) => {
  const w = walkthrough(s);

  it("is exactly what calculate() returns for its inputs", () => {
    expect(w.result).toEqual(calculate(s, w.inputs));
    expect(w.inputs.price).toBe(WALK.price);
  });

  it("lists every result line once, with the same amount", () => {
    const lineSteps = w.steps.filter((x) => x.kind === "line");
    expect(lineSteps.map((x) => [x.id, x.amount])).toEqual(w.result.lines.map((l) => [l.id, l.amount]));
  });

  it("shows multiplication that matches the tax line", () => {
    for (const l of w.result.lines) {
      if (!l.basis || l.basis.capped && l.id === "state-tax") continue;
      expect(round2((l.basis.base * l.basis.ratePct) / 100), l.id).toBe(l.amount);
    }
  });

  it("taxable price step is the base the state tax was charged on", () => {
    const taxable = w.steps.find((x) => x.id === "taxable");
    const tax = w.result.lines.find((l) => l.id === "state-tax");
    if (taxable && tax?.basis) expect(taxable.amount).toBe(tax.basis.base);
  });

  it("only uses a trade-in when the trade-in rule is confirmed", () => {
    const t = s.salesTax.tradeInReducesBase;
    const r = s.salesTax.stateRatePct;
    const known = t.value !== null && (t.status === "verified" || t.status === "partial") && !(r.value === 0 && r.status !== "unverified" && r.status !== "conflict");
    expect(w.inputs.tradeIn).toBe(known ? WALK.tradeIn : 0);
  });

  it("county spread is sorted and each row is a calculate() result", () => {
    const sp = countySpread(s);
    if (!sp) return;
    const vals = sp.rows.map((r) => r.place.value);
    expect([...vals].sort((a, b) => a - b)).toEqual(vals);
    for (const r of sp.rows) expect(r.result).toEqual(calculate(s, { ...w.inputs, localRatePct: 0, localOverAmount: 0, localOverRatePct: 0, county: "", ...r.place.inputs }));
    expect(sp.rows[2].result.total).toBeGreaterThanOrEqual(sp.rows[0].result.total);
  });
});

describe("county examples", () => {
  const ca = states.find((s) => s.code === "CA")!;
  it("California uses the same local rate the county picker would", () => {
    const r = rankedPlaces(ca)!;
    for (const p of r.places) expect(p.value).toBe(localRateInputs(ca, p.key)!.localRatePct);
  });

  it("Texas ranks counties by their county fee", () => {
    const tx = states.find((s) => s.code === "TX")!;
    const r = rankedPlaces(tx)!;
    expect(r.kind).toBe("fee");
    expect(r.places.length).toBe(254);
    expect(walkthrough(tx).result.excluded.map((e) => e.label)).not.toContain(tx.counties!.label);
  });

  it("names places the way people say them", () => {
    expect(placeName("Travis")).toBe("Travis County");
    expect(placeName("Carson City")).toBe("Carson City");
    expect(placeName("New York City (Bronx, Brooklyn, Manhattan, Queens, Staten Island)")).toBe("New York City");
    expect(placeName("Delaware (COTA)")).toBe("Delaware County (COTA area)");
  });
});
