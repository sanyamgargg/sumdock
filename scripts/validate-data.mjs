// Validates every data/states/*.json file.
// Errors fail the build. Warnings are printed. --strict turns stale-source warnings into errors.
import fs from "node:fs";
import path from "node:path";

const strict = process.argv.includes("--strict");
const MAX_AGE_DAYS = 45;
const STATUSES = ["verified", "partial", "conflict", "unverified"];
const dir = path.join(process.cwd(), "data", "states");

let errors = 0;
let warnings = 0;
const err = (f, m) => { errors++; console.error(`ERROR  ${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.warn(`WARN   ${f}: ${m}`); };

const today = new Date();
const ageDays = (iso) => (today - new Date(iso)) / 86400000;

function checkSourced(file, where, s) {
  if (!s || typeof s !== "object") return err(file, `${where}: missing`);
  if (!STATUSES.includes(s.status)) err(file, `${where}: bad status "${s.status}"`);
  if (!Array.isArray(s.sources)) return err(file, `${where}: sources must be an array`);
  const usable = s.status === "verified" || s.status === "partial";
  if (usable && s.value === null) err(file, `${where}: status ${s.status} but value is null`);
  if (usable && s.sources.length === 0) err(file, `${where}: ${s.status} value has no source`);
  if (s.status === "verified" && !s.sources.some((x) => x.publisherType !== "secondary"))
    err(file, `${where}: "verified" needs at least one official (non-secondary) source`);
  if (s.status === "conflict" && !(s.alt && s.alt.length >= 2)) err(file, `${where}: conflict needs alt values`);
  for (const src of s.sources) {
    if (!/^https?:\/\//.test(src.url ?? "")) err(file, `${where}: bad source url`);
    if (!src.title) err(file, `${where}: source missing title`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(src.accessed ?? "")) err(file, `${where}: source missing accessed date`);
    else if (ageDays(src.accessed) > MAX_AGE_DAYS) {
      (strict ? err : warn)(file, `${where}: source ${src.url} last opened ${src.accessed} (>${MAX_AGE_DAYS} days)`);
    }
  }
}


// Optional hand-written prose. No digits (figures come from {state} and {stateRate} tokens) and every
// block must cite URLs that are already sources elsewhere in the same file.
function collectUrls(o, out = new Set()) {
  if (Array.isArray(o)) o.forEach((x) => collectUrls(x, out));
  else if (o && typeof o === "object") {
    if (Array.isArray(o.sources)) for (const s of o.sources) if (s && typeof s === "object" && s.url) out.add(s.url);
    for (const [k, v] of Object.entries(o)) if (k !== "content") collectUrls(v, out);
  }
  return out;
}
function checkText(file, where, text) {
  if (typeof text !== "string" || text.trim() === "") return err(file, `${where}: must be a non-empty string`);
  const stripped = text.replace(/\{(state|stateRate)\}/g, "");
  if (/\d/.test(stripped)) err(file, `${where}: contains a digit; use {stateRate} or leave the figure to the generated sections`);
  if (/[{}]/.test(stripped)) err(file, `${where}: unknown token (allowed: {state}, {stateRate})`);
}
function checkBlock(file, where, b, urls) {
  if (!b || typeof b !== "object") return err(file, `${where}: must be an object`);
  checkText(file, `${where}.text`, b.text);
  if (!Array.isArray(b.sources) || b.sources.length === 0) return err(file, `${where}: needs at least one source URL`);
  for (const u of b.sources) if (!urls.has(u)) err(file, `${where}: source ${u} is not a source in this file`);
}
function checkContent(file, d) {
  const c = d.content;
  if (!c || typeof c !== "object" || Array.isArray(c)) return err(file, "content: must be an object");
  for (const k of Object.keys(c)) if (!["intro", "howItWorks", "faq"].includes(k)) err(file, `content.${k}: unknown key`);
  const urls = collectUrls(d);
  if (c.intro !== undefined) checkText(file, "content.intro", c.intro);
  if (c.howItWorks !== undefined) {
    if (!Array.isArray(c.howItWorks)) err(file, "content.howItWorks: must be an array");
    else c.howItWorks.forEach((b, n) => checkBlock(file, `content.howItWorks[${n}]`, b, urls));
  }
  if (c.faq !== undefined) {
    if (!Array.isArray(c.faq)) err(file, "content.faq: must be an array");
    else c.faq.forEach((b, n) => {
      checkBlock(file, `content.faq[${n}]`, b, urls);
      if (typeof b?.q !== "string" || !b.q.trim()) err(file, `content.faq[${n}].q: must be a non-empty string`);
      else if (/\d/.test(b.q)) err(file, `content.faq[${n}].q: contains a digit`);
    });
  }
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
if (files.length === 0) err("data/states", "no state files found");

const slugs = new Set();
for (const f of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
  catch (e) { err(f, `invalid JSON: ${e.message}`); continue; }

  for (const k of ["code", "name", "slug", "lastReviewed"]) if (!d[k]) err(f, `missing ${k}`);
  if (slugs.has(d.slug)) err(f, `duplicate slug ${d.slug}`);
  slugs.add(d.slug);
  if (f.replace(".json", "").toUpperCase() !== d.code) err(f, "file name must match state code");

  const st = d.salesTax ?? {};
  if (st.tradeInCap != null && !(typeof st.tradeInCap === "number" && st.tradeInCap > 0)) err(f, "salesTax.tradeInCap must be a positive number");
  for (const k of ["stateRatePct", "tradeInReducesBase", "local", "outOfStateCredit"]) checkSourced(f, `salesTax.${k}`, st[k]);
  if (st.useTax) checkSourced(f, "salesTax.useTax", st.useTax);

  if (d.localRates) {
    checkSourced(f, "localRates.rates", d.localRates.rates);
    const base = st.stateRatePct?.value ?? 0;
    for (const [county, e] of Object.entries(d.localRates.rates?.value ?? {})) {
      const floor = d.localRates.mode === "combined" ? base : 0;
      if (!["combined", "localOnly"].includes(d.localRates.mode)) err(f, "localRates.mode must be combined or localOnly");
      if (typeof e.county !== "number" || e.county < floor) err(f, `localRates ${county}: county rate must be a number >= state rate`);
      for (const [place, r] of Object.entries(e.places ?? {}))
        if (typeof r !== "number" || r < floor || r > 15) err(f, `localRates ${county}/${place}: implausible rate ${r}`);
      for (const [place, t] of Object.entries(e.tiers ?? {})) {
        const full = e.places?.[place];
        if (full === undefined) err(f, `localRates ${county}/${place}: tier has no matching place`);
        else if (!(typeof t.over === "number" && t.over > 0)) err(f, `localRates ${county}/${place}: tier "over" must be a positive number`);
        else if (typeof t.rate !== "number" || t.rate < floor || t.rate > full) err(f, `localRates ${county}/${place}: tier rate must be between ${floor} and the place rate ${full}`);
      }
    }
  }


  if (d.content !== undefined) checkContent(f, d);

  const ids = new Set();
  for (const fee of d.fees ?? []) {
    if (ids.has(fee.id)) err(f, `duplicate fee id ${fee.id}`);
    ids.add(fee.id);
    checkSourced(f, `fees.${fee.id}.amount`, fee.amount);
    const AGES = ["new", "recent", "older"];
    const checkWhen = (w, where) => {
      if (!w) return;
      for (const a of [].concat(w.vehicleAge ?? [])) if (!AGES.includes(a)) err(f, `${where}: bad vehicleAge "${a}"`);
      if (w.priceAtLeast !== undefined && typeof w.priceAtLeast !== "number") err(f, `${where}: priceAtLeast must be a number`);
      for (const x of w.anyOf ?? []) checkWhen(x, `${where}.anyOf`);
    };
    checkWhen(fee.when, `fees.${fee.id}.when`);
    if (fee.altCounties) {
      const names = Object.keys(d.counties?.fees?.value ?? {});
      if (typeof fee.altCounties.amount !== "number" || !Array.isArray(fee.altCounties.counties)) err(f, `fees.${fee.id}.altCounties is malformed`);
      else for (const c of fee.altCounties.counties) if (!names.includes(c)) err(f, `fees.${fee.id}.altCounties: ${c} is not in the county table`);
    }
  }
  if (d.counties?.heavyFees) {
    const names = Object.keys(d.counties.fees?.value ?? {});
    if (typeof d.counties.heavyOverLbs !== "number") err(f, "counties.heavyFees needs heavyOverLbs");
    for (const [k, v] of Object.entries(d.counties.heavyFees)) {
      if (!names.includes(k)) err(f, `counties.heavyFees: ${k} is not in counties.fees`);
      if (typeof v !== "number" || v < 0) err(f, `counties.heavyFees.${k} must be a non-negative number`);
    }
  }
  if (!(d.fees ?? []).length) err(f, "no fees listed");
}

console.log(`\nChecked ${files.length} state files: ${errors} error(s), ${warnings} warning(s).`);
if (errors > 0) process.exit(1);
