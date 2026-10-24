import { DEFAULT_INPUTS } from "./content";
import type { Fuel, Inputs, MpgBand, StateData, VehicleAge, WeightBand } from "./types";

/**
 * Shareable estimate links. The calculator inputs go into the page address so a result can be pasted into a
 * message or forum thread. The trade-in and tax already paid elsewhere are left out on purpose: they are
 * personal amounts, and the person sharing may not want to show them.
 */

export interface ShareContext {
  /** Counties and places chosen in the rate picker. */
  rateCounty: string;
  ratePlace: string;
  /** True when the person typed their own local rate instead of using the picker. */
  rateEdited: boolean;
}

export interface Decoded {
  inputs: Partial<Inputs>;
  rateCounty: string;
  ratePlace: string;
  /** A local rate typed by the sharer, applied after the picker. */
  localRatePct?: number;
}

const FUELS: Fuel[] = ["gas", "ev"];
const MPG: MpgBand[] = ["0-19", "20-39", "40+"];
const WEIGHT: WeightBand[] = ["light", "mid", "heavy"];
const AGE: VehicleAge[] = ["new", "recent", "older"];

const num = (v: string | null, min: number, max: number): number | undefined => {
  if (v === null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};
const oneOf = <T extends string>(v: string | null, list: T[]): T | undefined => (v !== null && (list as string[]).includes(v) ? (v as T) : undefined);

/** Build the query string (no leading "?"). Values equal to the defaults are left out to keep links short. */
export function encodeInputs(i: Inputs, ctx: ShareContext): string {
  const q = new URLSearchParams();
  const d = DEFAULT_INPUTS;
  if (i.price !== d.price) q.set("price", String(i.price));
  if (i.fuel !== d.fuel) q.set("fuel", i.fuel);
  if (i.mpgBand !== d.mpgBand) q.set("mpg", i.mpgBand);
  if (i.weightBand !== d.weightBand) q.set("wband", i.weightBand);
  if (i.weightLbs !== d.weightLbs) q.set("lbs", String(i.weightLbs));
  if (i.county !== d.county) q.set("county", i.county);
  if (i.vehicleAge !== d.vehicleAge) q.set("age", i.vehicleAge);
  if (i.noPlateToTransfer !== d.noPlateToTransfer) q.set("plate", i.noPlateToTransfer ? "1" : "0");
  if (i.outOfStateNewDealer !== d.outOfStateNewDealer) q.set("oosdealer", i.outOfStateNewDealer ? "1" : "0");
  if (ctx.rateCounty) q.set("rc", ctx.rateCounty);
  if (ctx.ratePlace) q.set("rp", ctx.ratePlace);
  // A local rate is stored only when it did not come from the picker.
  if ((ctx.rateEdited || !ctx.rateCounty) && i.localRatePct !== d.localRatePct) q.set("rate", String(i.localRatePct));
  return q.toString();
}

/** Read a query string. Anything unknown or out of range is ignored, so a bad link never breaks the page. */
export function decodeInputs(search: string, state: StateData): Decoded {
  const q = new URLSearchParams(search);
  const inputs: Partial<Inputs> = {};
  const price = num(q.get("price"), 0, 10_000_000);
  if (price !== undefined) inputs.price = price;
  const fuel = oneOf(q.get("fuel"), FUELS);
  if (fuel) inputs.fuel = fuel;
  const mpg = oneOf(q.get("mpg"), MPG);
  if (mpg) inputs.mpgBand = mpg;
  const wband = oneOf(q.get("wband"), WEIGHT);
  if (wband) inputs.weightBand = wband;
  const lbs = num(q.get("lbs"), 0, 30_000);
  if (lbs !== undefined) inputs.weightLbs = lbs;
  const age = oneOf(q.get("age"), AGE);
  if (age) inputs.vehicleAge = age;
  const plate = q.get("plate");
  if (plate === "0" || plate === "1") inputs.noPlateToTransfer = plate === "1";
  const dealer = q.get("oosdealer");
  if (dealer === "0" || dealer === "1") inputs.outOfStateNewDealer = dealer === "1";

  const feeCounties = state.counties?.fees.value ? Object.keys(state.counties.fees.value) : [];
  const county = q.get("county");
  if (county && feeCounties.includes(county)) inputs.county = county;

  const table = state.localRates?.rates.value ?? null;
  let rateCounty = "";
  let ratePlace = "";
  const rc = q.get("rc");
  if (table && rc && Object.prototype.hasOwnProperty.call(table, rc)) {
    rateCounty = rc;
    const rp = q.get("rp");
    if (rp && Object.prototype.hasOwnProperty.call(table[rc].places, rp)) ratePlace = rp;
  }
  const rate = num(q.get("rate"), 0, 30);
  return { inputs, rateCounty, ratePlace, ...(rate !== undefined ? { localRatePct: rate } : {}) };
}
