import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "./content";
import { decodeInputs, encodeInputs } from "./share";
import type { StateData } from "./types";

const load = (code: string): StateData =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "states", `${code}.json`), "utf8"));
const none = { rateCounty: "", ratePlace: "", rateEdited: false };

describe("share links", () => {
  const az = load("az");
  const ny = load("ny");
  it("the default inputs make an empty query", () => {
    expect(encodeInputs(DEFAULT_INPUTS, none)).toBe("");
  });
  it("never includes the trade-in or tax paid elsewhere", () => {
    const q = encodeInputs({ ...DEFAULT_INPUTS, tradeIn: 8000, outOfStateTaxPaid: 1200, price: 41000 }, none);
    expect(q).toBe("price=41000");
    expect(q).not.toContain("8000");
    expect(q).not.toContain("1200");
  });
  it("round trips the picker choice and basic inputs", () => {
    const i = { ...DEFAULT_INPUTS, price: 52000, fuel: "ev" as const, vehicleAge: "older" as const };
    const q = encodeInputs(i, { rateCounty: "Maricopa", ratePlace: "Avondale", rateEdited: false });
    const d = decodeInputs(q, az);
    expect(d.inputs.price).toBe(52000);
    expect(d.inputs.fuel).toBe("ev");
    expect(d.inputs.vehicleAge).toBe("older");
    expect(d.rateCounty).toBe("Maricopa");
    expect(d.ratePlace).toBe("Avondale");
    expect(d.localRatePct).toBeUndefined();
  });
  it("stores a typed local rate only when it did not come from the picker", () => {
    const i = { ...DEFAULT_INPUTS, localRatePct: 2.5 };
    expect(encodeInputs(i, { rateCounty: "Maricopa", ratePlace: "", rateEdited: false })).not.toContain("rate=");
    expect(encodeInputs(i, { rateCounty: "Maricopa", ratePlace: "", rateEdited: true })).toContain("rate=2.5");
    expect(decodeInputs("rate=2.5", az).localRatePct).toBe(2.5);
  });
  it("ignores unknown counties, places and bad values", () => {
    const d = decodeInputs("rc=Atlantis&rp=Nowhere&price=abc&fuel=diesel&age=ancient&lbs=-5&rate=99&county=Zzz", ny);
    expect(d.inputs).toEqual({});
    expect(d.rateCounty).toBe("");
    expect(d.localRatePct).toBeUndefined();
  });
  it("ignores a place that does not belong to the county", () => {
    expect(decodeInputs("rc=Maricopa&rp=Tucson", az).ratePlace).toBe("");
  });
  it("does not trust inherited object keys", () => {
    expect(decodeInputs("rc=__proto__", az).rateCounty).toBe("");
    expect(decodeInputs("rc=constructor", az).rateCounty).toBe("");
  });
  it("accepts a fee county from the state's own county table", () => {
    const counties = Object.keys(ny.counties!.fees.value!);
    expect(decodeInputs(`county=${encodeURIComponent(counties[0])}`, ny).inputs.county).toBe(counties[0]);
  });
  it("round-trips the vehicle age in years and drops bad values", () => {
    const q = encodeInputs({ ...DEFAULT_INPUTS, ageYears: 7 }, { rateCounty: "", ratePlace: "", rateEdited: false });
    expect(q).toContain("years=7");
    expect(decodeInputs(q, ny).inputs.ageYears).toBe(7);
    expect(decodeInputs("years=-3", ny).inputs.ageYears).toBeUndefined();
    expect(decodeInputs("years=900", ny).inputs.ageYears).toBeUndefined();
    expect(encodeInputs(DEFAULT_INPUTS, { rateCounty: "", ratePlace: "", rateEdited: false })).not.toContain("years");
  });
});
