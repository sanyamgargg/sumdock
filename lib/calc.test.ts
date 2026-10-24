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
  vehicleAge: "new",
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
  it("asks for a county before adding the county fee", () => {
    const r = calculate(load("ny"), base);
    expect(r.excluded.find((e) => e.label.startsWith("County use tax"))?.reason).toBe("Choose your county to include this fee.");
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
  it("charges the 33 title fee in the 42 listed counties and 28 elsewhere", () => {
    expect(line(calculate(t, { ...base, county: "Travis" }), "title")).toBe(33);
    expect(line(calculate(t, { ...base, county: "Harris" }), "title")).toBe(33);
    expect(line(calculate(t, { ...base, county: "Borden" }), "title")).toBe(28);
    expect(line(calculate(t, base), "title")).toBe(28);
    expect(t.fees.find((f) => f.id === "title")!.altCounties!.counties).toHaveLength(42);
  });
  it("adds the 1 insurance verification and 4.75 processing fees", () => {
    expect(line(calculate(t, base), "insurance-verification")).toBe(1);
    expect(line(calculate(t, base), "processing")).toBe(4.75);
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

describe("New York and Florida county rates", () => {
  const ny = load("ny").localRates!.rates.value!;
  const fl = load("fl").localRates!.rates.value!;
  it("NY matches Publication 718 spot checks", () => {
    expect(Object.keys(ny)).toHaveLength(58);
    expect(ny["Erie"].county).toBe(8.75);
    expect(ny["Suffolk"].county).toBe(8.75);
    expect(ny["Ontario"].county).toBe(7.5);
    expect(ny["Westchester"].places["Yonkers"]).toBe(8.875);
    expect(ny["New York City (Bronx, Brooklyn, Manhattan, Queens, Staten Island)"].county).toBe(8.875);
  });
  it("FL matches DR-15DSS spot checks", () => {
    expect(Object.keys(fl)).toHaveLength(67);
    expect(fl["Hamilton"].county).toBe(2);
    expect(fl["Citrus"].county).toBe(0);
    expect(fl["Palm Beach"].county).toBe(0.5);
    expect(fl["Miami-Dade"].county).toBe(1);
    expect(Object.values(fl).reduce((s, c) => s + c.county, 0)).toBeCloseTo(73.5, 6);
  });
  it("FL surtax from a county rate applies to first $5,000 only", () => {
    const r = calculate(load("fl"), { ...base, price: 30000, tradeIn: 0, localRatePct: fl["Hillsborough"].county });
    expect(line(r, "local-tax")).toBeCloseTo(75, 2);
  });
});

describe("Pennsylvania", () => {
  const pa = load("pa");
  it("is publishable with the sourced fees", () => {
    expect(publishability(pa).publishable).toBe(true);
  });
  it("taxes the price at 6% with no local tax outside Allegheny and Philadelphia", () => {
    const r = calculate(pa, { ...base, price: 30000, tradeIn: 0 });
    expect(line(r, "state-tax")).toBe(1800);
    expect(line(r, "title")).toBe(72);
    expect(line(r, "registration")).toBe(48);
    expect(r.total).toBe(1920);
  });
  it("adds 1% in Allegheny and 2% in Philadelphia", () => {
    const rates = pa.localRates!.rates.value!;
    expect(rates["Allegheny"].county).toBe(1);
    expect(rates["Philadelphia"].county).toBe(2);
    expect(rates["Centre"].county).toBe(0);
    expect(Object.keys(rates)).toHaveLength(67);
    const r = calculate(pa, { ...base, price: 30000, localRatePct: rates["Philadelphia"].county });
    expect(line(r, "local-tax")).toBe(600);
  });
  it("reduces the base by a trade-in and adds the electric road user charge", () => {
    const r = calculate(pa, { ...base, price: 30000, tradeIn: 10000, fuel: "ev" });
    expect(line(r, "state-tax")).toBe(1200);
    expect(line(r, "ev-ruc")).toBe(250);
  });
  it("lists the county local-use fee as not included", () => {
    const r = calculate(pa, base);
    expect(r.excluded.some((e) => e.label.includes("Fee for Local Use"))).toBe(true);
  });
});

describe("Ohio", () => {
  const oh = load("oh");
  const rates = oh.localRates!.rates.value!;
  it("is publishable and lists 88 counties plus 5 transit-area rates", () => {
    expect(publishability(oh).publishable).toBe(true);
    expect(Object.keys(rates)).toHaveLength(93);
    expect(rates["Franklin"].county).toBe(8);
    expect(rates["Hamilton"].county).toBe(7.8);
    expect(rates["Butler"].county).toBe(6.5);
  });
  it("uses the combined county rate and adds title and registration", () => {
    // 7.25% combined in Adams County = 5.75% state + 1.5% local
    const r = calculate(oh, { ...base, price: 20000, localRatePct: rates["Adams"].county - 5.75 });
    expect(line(r, "state-tax")).toBe(1150);
    expect(line(r, "local-tax")).toBe(300);
    expect(line(r, "title")).toBe(18);
    expect(line(r, "registration")).toBe(36);
  });
  it("applies no trade-in credit and adds the electric vehicle fee", () => {
    const r = calculate(oh, { ...base, price: 20000, tradeIn: 5000, fuel: "ev" });
    expect(line(r, "state-tax")).toBe(1150);
    expect(line(r, "ev-fee")).toBe(200);
  });
});

describe("Georgia", () => {
  const ga = load("ga");
  it("charges 7% TAVT with trade-in reduction, title and registration", () => {
    expect(publishability(ga).publishable).toBe(true);
    const r = calculate(ga, { ...base, price: 30000, tradeIn: 10000 });
    expect(line(r, "state-tax")).toBe(1400);
    expect(line(r, "title")).toBe(18);
    expect(line(r, "registration")).toBe(20);
  });
  it("adds the electric vehicle fee", () => {
    const r = calculate(ga, { ...base, price: 30000, fuel: "ev" });
    expect(line(r, "ev-fee")).toBe(238.59);
  });
});

describe("North Carolina", () => {
  const nc = load("nc");
  it("charges 3% highway use tax after trade-in plus title and plate", () => {
    expect(publishability(nc).publishable).toBe(true);
    const r = calculate(nc, { ...base, price: 30000, tradeIn: 10000 });
    expect(line(r, "state-tax")).toBe(600);
    expect(line(r, "title")).toBe(66.75);
    expect(line(r, "registration")).toBe(46.25);
  });
  it("adds the electric vehicle fee", () => {
    const r = calculate(nc, { ...base, price: 30000, fuel: "ev" });
    expect(line(r, "ev-fee")).toBe(214.5);
  });
});

describe("Michigan", () => {
  const mi = load("mi");
  it("is not publishable yet because registration is left out", () => {
    expect(publishability(mi).publishable).toBe(false);
    expect(publishability(mi).reasons).toContain("no verified registration fee");
    const r = calculate(mi, { ...base, price: 30000 });
    expect(line(r, "state-tax")).toBe(1800);
    expect(line(r, "title")).toBe(15);
    expect(r.excluded.some((e) => e.label.includes("Registration"))).toBe(true);
  });
  it("caps the trade-in reduction at 12,000", () => {
    const r = calculate(mi, { ...base, price: 40000, tradeIn: 20000 });
    expect(line(r, "state-tax")).toBe(1680);
  });
  it("adds the electric vehicle fee", () => {
    expect(line(calculate(mi, { ...base, price: 30000, fuel: "ev" }), "ev-fee")).toBe(267);
  });
});

describe("New York county use tax and commuter fee", () => {
  const ny = load("ny");
  const NYC = "New York City (Bronx, Brooklyn, Manhattan, Queens, Staten Island)";
  it("adds 80 in New York City for any weight", () => {
    expect(line(calculate(ny, { ...base, county: NYC, weightLbs: 3000 }), "county-fee")).toBe(80);
    expect(line(calculate(ny, { ...base, county: NYC, weightLbs: 4500 }), "county-fee")).toBe(80);
  });
  it("uses 10 or 20 in an ordinary county by weight", () => {
    expect(line(calculate(ny, { ...base, county: "Erie", weightLbs: 3500 }), "county-fee")).toBe(10);
    expect(line(calculate(ny, { ...base, county: "Erie", weightLbs: 3501 }), "county-fee")).toBe(20);
  });
  it("adds the commuter fee in Westchester and Rockland, nothing in Essex", () => {
    expect(line(calculate(ny, { ...base, county: "Westchester", weightLbs: 3000 }), "county-fee")).toBe(80);
    expect(line(calculate(ny, { ...base, county: "Westchester", weightLbs: 4000 }), "county-fee")).toBe(110);
    expect(line(calculate(ny, { ...base, county: "Rockland", weightLbs: 4000 }), "county-fee")).toBe(50);
    expect(line(calculate(ny, { ...base, county: "Essex" }), "county-fee")).toBe(0);
  });
  it("has an entry for every county in the rate table", () => {
    const names = Object.keys(ny.localRates!.rates.value!);
    expect(Object.keys(ny.counties!.fees.value!).sort()).toEqual(names.sort());
  });
});


describe("Virginia", () => {
  const va = load("va");
  it("is publishable", () => expect(publishability(va).publishable).toBe(true));
  it("taxes the full price at 4.15% and ignores a trade-in", () => {
    const r = calculate(va, { ...base, price: 30000, tradeIn: 10000 });
    expect(line(r, "state-tax")).toBe(1245);
  });
  it("charges the title fee and registration by weight class", () => {
    expect(line(calculate(va, { ...base, weightLbs: 3500 }), "title")).toBe(15);
    expect(line(calculate(va, { ...base, weightLbs: 4000 }), "registration")).toBe(30.75);
    expect(line(calculate(va, { ...base, weightLbs: 4001 }), "registration")).toBe(35.75);
    expect(line(calculate(va, { ...base, weightLbs: 6500 }), "registration")).toBe(35.75);
  });
  it("leaves out registration above 6,500 lbs and always lists the highway use fee as not included", () => {
    const r = calculate(va, { ...base, weightLbs: 7000 });
    expect(line(r, "registration")).toBeUndefined();
    expect(r.excluded.map((e) => e.label)).toContain("Registration (by weight)");
    expect(calculate(va, base).excluded.map((e) => e.label)).toContain("Highway use fee");
  });
  it("adds the electric vehicle fee only for EVs", () => {
    expect(line(calculate(va, { ...base, fuel: "ev" }), "ev-fee")).toBe(135.63);
    expect(line(calculate(va, base), "ev-fee")).toBeUndefined();
  });
});

describe("Washington", () => {
  const wa = load("wa");
  const rates = wa.localRates!.rates.value!;
  it("is publishable and has 39 counties", () => {
    expect(publishability(wa).publishable).toBe(true);
    expect(Object.keys(rates).length).toBe(39);
  });
  it("local rates match the DOR table", () => {
    expect(rates["King"].county).toBe(3.8);
    expect(rates["King"].places["Seattle"]).toBe(4.05);
    expect(rates["Yakima"].places["Yakima (City)"]).toBe(1.8);
  });
  it("applies 7% state and a trade-in, plus the local rate", () => {
    const r = calculate(wa, { ...base, price: 30000, tradeIn: 10000, localRatePct: 4.05 });
    expect(line(r, "state-tax")).toBe(1400);
    expect(line(r, "local-tax")).toBe(810);
  });
  it("includes title and registration fees and holds out EV and transit fees", () => {
    const r = calculate(wa, base);
    expect(line(r, "title")).toBe(15);
    expect(line(r, "title-filing")).toBe(12.5);
    expect(line(r, "title-service")).toBe(29);
    expect(line(r, "registration")).toBe(30);
    expect(r.excluded.map((e) => e.label)).toContain("Regional transit excise tax and local district fees");
    expect(calculate(wa, { ...base, fuel: "ev" }).excluded.map((e) => e.label)).toContain("Electric vehicle fees");
  });
});

describe("Arizona", () => {
  const az = load("az");
  const rates = az.localRates!.rates.value!;
  it("is publishable with 15 counties", () => {
    expect(publishability(az).publishable).toBe(true);
    expect(Object.keys(rates).length).toBe(15);
  });
  it("county rates are the retail rate minus the 5.6% state rate", () => {
    expect(rates["Maricopa"].county).toBeCloseTo(0.7, 6);
    expect(rates["Pima"].county).toBeCloseTo(0.5, 6);
    expect(rates["Mohave"].county).toBeCloseTo(0, 6);
    expect(rates["Yuma"].county).toBeCloseTo(1.112, 6);
    expect(rates["Apache"].county).toBe(rates["Greenlee"].county);
  });
  it("taxes the price less a trade-in at 5.6% and adds the county rate", () => {
    const r = calculate(az, { ...base, price: 30000, tradeIn: 10000, localRatePct: 0.7 });
    expect(line(r, "state-tax")).toBe(1120);
    expect(line(r, "local-tax")).toBe(140);
  });
  it("charges title, registration and air quality fees; air quality skipped for EVs", () => {
    const r = calculate(az, base);
    expect(line(r, "title")).toBe(4);
    expect(line(r, "registration")).toBe(8);
    expect(line(r, "air-quality")).toBe(1.5);
    expect(line(calculate(az, { ...base, fuel: "ev" }), "air-quality")).toBeUndefined();
  });
  it("lists the vehicle license tax and city tax as not included", () => {
    const labels = calculate(az, base).excluded.map((e) => e.label);
    expect(labels).toContain("Vehicle license tax");
    expect(labels).toContain("City privilege tax");
  });
  it("credits tax paid to another state, never above what is owed", () => {
    const r = calculate(az, { ...base, price: 10000, outOfStateTaxPaid: 9999 });
    expect(line(r, "oos-credit")).toBe(-560);
  });
});

describe("New Jersey", () => {
  const nj = load("nj");
  it("is publishable", () => expect(publishability(nj).publishable).toBe(true));
  it("taxes the price less a trade-in at 6.625%, with no local tax", () => {
    const r = calculate(nj, { ...base, price: 30000, tradeIn: 10000 });
    expect(line(r, "state-tax")).toBe(1325);
    expect(line(r, "local-tax")).toBeUndefined();
  });
  it("charges four years of registration on a new vehicle, by weight", () => {
    expect(line(calculate(nj, { ...base, vehicleAge: "new", weightLbs: 3000 }), "registration-new")).toBe(236);
    expect(line(calculate(nj, { ...base, vehicleAge: "new", weightLbs: 4000 }), "registration-new")).toBe(336);
    expect(line(calculate(nj, { ...base, vehicleAge: "new" }), "registration-recent")).toBeUndefined();
  });
  it("charges one year on a used vehicle, by weight and age", () => {
    expect(line(calculate(nj, { ...base, vehicleAge: "recent", weightLbs: 3000 }), "registration-recent")).toBe(59);
    expect(line(calculate(nj, { ...base, vehicleAge: "recent", weightLbs: 4000 }), "registration-recent")).toBe(84);
    expect(line(calculate(nj, { ...base, vehicleAge: "older", weightLbs: 3000 }), "registration-older")).toBe(46.5);
    expect(line(calculate(nj, { ...base, vehicleAge: "older", weightLbs: 4000 }), "registration-older")).toBe(71.5);
  });
  it("adds the 0.4% surcharge on a new vehicle at $45,000 or more, or under 19 mpg, never on a used one", () => {
    expect(line(calculate(nj, { ...base, price: 44999 }), "luxury-surcharge")).toBeUndefined();
    expect(line(calculate(nj, { ...base, price: 45000 }), "luxury-surcharge")).toBe(180);
    expect(line(calculate(nj, { ...base, price: 30000, mpgBand: "0-19" }), "luxury-surcharge")).toBe(120);
    expect(line(calculate(nj, { ...base, price: 60000, vehicleAge: "recent" }), "luxury-surcharge")).toBeUndefined();
    expect(line(calculate(nj, { ...base, price: 60000, fuel: "ev" }), "luxury-surcharge")).toBe(240);
  });
  it("zero emission fee: one year when used, held out when new", () => {
    expect(line(calculate(nj, { ...base, fuel: "ev", vehicleAge: "older" }), "zev-fee")).toBe(270);
    const r = calculate(nj, { ...base, fuel: "ev", vehicleAge: "new" });
    expect(line(r, "zev-fee")).toBeUndefined();
    expect(r.excluded.map((e) => e.label)).toContain("Zero emission vehicle fee (4 years, new vehicle)");
    expect(line(calculate(nj, base), "zev-fee")).toBeUndefined();
  });
  it("matches() keeps states without vehicleAge conditions unchanged", () => {
    const tx = load("tx");
    expect(calculate(tx, { ...base, vehicleAge: "new" }).total).toBe(calculate(tx, { ...base, vehicleAge: "older" }).total);
  });
});

describe("Massachusetts", () => {
  const ma = load("ma");
  it("is publishable", () => expect(publishability(ma).publishable).toBe(true));
  it("taxes the price less a trade-in at 6.25%", () => {
    expect(line(calculate(ma, { ...base, price: 30000, tradeIn: 10000 }), "state-tax")).toBe(1250);
  });
  it("charges the title fee and a two-year registration, the same for EVs", () => {
    const r = calculate(ma, base);
    expect(line(r, "title")).toBe(75);
    expect(line(r, "registration")).toBe(60);
    expect(line(calculate(ma, { ...base, fuel: "ev" }), "registration")).toBe(60);
  });
  it("lists the yearly excise tax as not included", () => {
    expect(calculate(ma, base).excluded.map((e) => e.label)).toContain("Motor vehicle excise tax");
  });
  it("credits tax paid elsewhere up to what is owed", () => {
    expect(line(calculate(ma, { ...base, price: 10000, outOfStateTaxPaid: 9999 }), "oos-credit")).toBe(-625);
  });
});
