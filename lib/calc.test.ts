import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { calculate, publishability } from "./calc";
import type { Inputs, StateData } from "./types";

const load = (code: string): StateData =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "states", `${code}.json`), "utf8"));

const base: Inputs = {
  price: 25000,
  tradeIn: 0,
  localRatePct: 0,
  outOfStateTaxPaid: 0,
  fuel: "gas",
  mpgBand: "20-39",
  weightBand: "mid",
  weightLbs: 3500,
  county: "",
  noPlateToTransfer: false,
  outOfStateNewDealer: false,
};

const line = (r: ReturnType<typeof calculate>, id: string) => r.lines.find((l) => l.id === id)?.amount;

describe("Florida", () => {
  // Worked example reproduced from Florida DOR guidance (via FRVTA): $25,000 price,
  // $4,000 trade-in, 6% state tax, 1% surtax capped at the first $5,000.
  // Taxable base 21,000 -> 1,260 state + 50 surtax. Total with price = 22,310.
  it("matches the DOR worked example for tax", () => {
    const r = calculate(load("fl"), { ...base, tradeIn: 4000, localRatePct: 1 });
    expect(line(r, "state-tax")).toBe(1260);
    expect(line(r, "local-tax")).toBe(50);
    expect(21000 + 1260 + 50).toBe(22310);
  });
  it("applies the surtax cap only to the first $5,000 of the base", () => {
    const r = calculate(load("fl"), { ...base, price: 3000, localRatePct: 1.5 });
    expect(line(r, "local-tax")).toBe(45);
  });
  it("adds the initial registration fee only when there is no plate to transfer", () => {
    const f = load("fl");
    expect(line(calculate(f, base), "initial-registration")).toBeUndefined();
    expect(line(calculate(f, { ...base, noPlateToTransfer: true }), "initial-registration")).toBe(225);
  });
  it("lists the EV fee as excluded instead of guessing", () => {
    const r = calculate(load("fl"), { ...base, fuel: "ev" });
    expect(r.excluded.map((e) => e.label)).toContain("Electric vehicle annual fee");
  });
});

describe("Texas", () => {
  it("taxes price minus trade-in at 6.25%", () => {
    const r = calculate(load("tx"), { ...base, price: 30000, tradeIn: 10000 });
    expect(line(r, "state-tax")).toBe(1250); // 20,000 * 6.25%
  });
  it("credits tax paid to another state but never below zero", () => {
    const r = calculate(load("tx"), { ...base, outOfStateTaxPaid: 5000 });
    expect(line(r, "oos-credit")).toBe(-1562.5);
    expect(r.lines.reduce((s, l) => s + (l.id === "state-tax" || l.id === "oos-credit" ? l.amount : 0), 0)).toBe(0);
  });
  it("charges $50.75 registration and the $200 EV fee only for electric vehicles", () => {
    const t = load("tx");
    expect(line(calculate(t, base), "registration")).toBe(50.75);
    expect(line(calculate(t, base), "ev-fee")).toBeUndefined();
    expect(line(calculate(t, { ...base, fuel: "ev" }), "ev-fee")).toBe(200);
  });
  it("is publishable", () => {
    expect(publishability(load("tx")).publishable).toBe(true);
  });
});

describe("California", () => {
  it("does not reduce the base by a trade-in", () => {
    const r = calculate(load("ca"), { ...base, tradeIn: 5000, localRatePct: 1 });
    expect(line(r, "state-tax")).toBe(1812.5); // 25,000 * 7.25%
    expect(line(r, "local-tax")).toBe(250);
  });
  it("uses the current DMV fee page amounts", () => {
    const r = calculate(load("ca"), base);
    expect(line(r, "registration")).toBe(76);
    expect(line(r, "chp")).toBe(34);
    expect(line(r, "title")).toBe(28);
    expect(line(r, "vlf")).toBe(162.5); // 0.65% of 25,000
    expect(line(r, "transportation-improvement")).toBe(132); // $25,000-$34,999 tier
  });
  it("picks the transportation improvement tier by price", () => {
    const c = load("ca");
    expect(line(calculate(c, { ...base, price: 4999 }), "transportation-improvement")).toBe(33);
    expect(line(calculate(c, { ...base, price: 24999 }), "transportation-improvement")).toBe(66);
    expect(line(calculate(c, { ...base, price: 60000 }), "transportation-improvement")).toBe(231);
  });
  it("leaves the road improvement fee out for EVs and says why", () => {
    const r = calculate(load("ca"), { ...base, fuel: "ev" });
    expect(r.excluded.find((e) => e.label.startsWith("Road improvement"))?.reason).toMatch(/new ZEV/);
  });
  it("is publishable", () => {
    expect(publishability(load("ca")).publishable).toBe(true);
  });
});

describe("Oregon", () => {
  it("charges no sales tax and no use tax on an in-state purchase", () => {
    const r = calculate(load("or"), base);
    expect(line(r, "state-tax")).toBeUndefined();
    expect(line(r, "use-tax")).toBeUndefined();
  });
  it("charges 0.5% use tax on a new vehicle from an out-of-state dealer", () => {
    const r = calculate(load("or"), { ...base, outOfStateNewDealer: true });
    expect(line(r, "use-tax")).toBe(125);
  });
  it("subtracts tax paid elsewhere from the use tax", () => {
    const r = calculate(load("or"), { ...base, outOfStateNewDealer: true, outOfStateTaxPaid: 100 });
    expect(line(r, "use-tax")).toBe(25);
  });
  it("picks the right title and registration fees for EV vs gas 20-39 MPG", () => {
    const o = load("or");
    const gas = calculate(o, base);
    expect(line(gas, "title-gas-mid")).toBe(106);
    expect(line(gas, "registration-gas-mid")).toBe(136);
    const ev = calculate(o, { ...base, fuel: "ev" });
    expect(line(ev, "title-ev")).toBe(192);
    expect(line(ev, "registration-ev")).toBe(376);
    expect(line(ev, "title-gas-mid")).toBeUndefined();
  });
  it("is publishable", () => {
    expect(publishability(load("or")).publishable).toBe(true);
  });
});

describe("New York", () => {
  it("taxes price minus trade-in at 4% plus the local rate entered", () => {
    const r = calculate(load("ny"), { ...base, price: 30000, tradeIn: 10000, localRatePct: 4.5 });
    expect(line(r, "state-tax")).toBe(800); // 20,000 * 4%
    expect(line(r, "local-tax")).toBe(900); // 20,000 * 4.5%
  });
  it("looks up two-year registration by weight bracket", () => {
    const n = load("ny");
    expect(line(calculate(n, { ...base, weightLbs: 3500 }), "registration")).toBe(56.5);
    expect(line(calculate(n, { ...base, weightLbs: 1600 }), "registration")).toBe(26);
    expect(line(calculate(n, { ...base, weightLbs: 7200 }), "registration")).toBe(140);
  });
  it("applies the $32.50 minimum to electric vehicles", () => {
    expect(line(calculate(load("ny"), { ...base, fuel: "ev", weightLbs: 1000 }), "registration")).toBe(32.5);
  });
  it("lists county fees as excluded with the reason", () => {
    const r = calculate(load("ny"), base);
    expect(r.excluded.find((e) => e.label.startsWith("County use tax"))?.reason).toMatch(/Varies by county/);
  });
  it("is publishable", () => {
    expect(publishability(load("ny")).publishable).toBe(true);
  });
});

describe("Texas county fee", () => {
  const t = load("tx");
  it("asks for a county before including the fee", () => {
    const r = calculate(t, base);
    expect(line(r, "county-fee")).toBeUndefined();
    expect(r.excluded.map((e) => e.reason)).toContain("Choose your county to include this fee.");
  });
  it("uses the county amounts from the TxDMV chart", () => {
    expect(line(calculate(t, { ...base, county: "Harris" }), "county-fee")).toBe(11.5);
    expect(line(calculate(t, { ...base, county: "Bexar" }), "county-fee")).toBe(21.5);
    expect(line(calculate(t, { ...base, county: "Borden" }), "county-fee")).toBe(0);
    expect(line(calculate(t, { ...base, county: "Winkler" }), "county-fee")).toBe(7.5);
  });
  it("lists all 254 Texas counties", () => {
    expect(Object.keys(t.counties!.fees.value!)).toHaveLength(254);
  });
});

describe("California combined rates by county and city", () => {
  const ca = load("ca");
  const table = ca.localRates!.rates.value!;
  it("lists 58 counties and 331 places", () => {
    expect(Object.keys(table)).toHaveLength(58);
    expect(Object.values(table).reduce((n, c) => n + Object.keys(c.places).length, 0)).toBe(331);
  });
  it("matches spot checks from CDTFA-95", () => {
    expect(table["Los Angeles"].county).toBe(10.25);
    expect(table["Los Angeles"].places["Santa Monica"]).toBe(11.25);
    expect(table["San Francisco"].county).toBe(8.625);
    expect(table["Santa Clara"].places["San Jose"]).toBe(10);
    expect(table["Santa Cruz"].places["Santa Cruz (unincorporated)"]).toBe(9.5);
    expect(table["Del Norte"].places["Del Norte (unincorporated)"]).toBe(8.25);
  });
  it("local rate input is combined minus the 7.25% state rate", () => {
    const r = calculate(ca, { ...base, price: 30000, tradeIn: 0, localRatePct: 11.25 - 7.25 });
    const tax = line(r, "state-tax")! + line(r, "local-tax")!;
    expect(tax).toBeCloseTo(30000 * 0.1125, 2);
  });
});
