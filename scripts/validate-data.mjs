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
  for (const k of ["stateRatePct", "tradeInReducesBase", "local", "outOfStateCredit"]) checkSourced(f, `salesTax.${k}`, st[k]);
  if (st.useTax) checkSourced(f, "salesTax.useTax", st.useTax);

  const ids = new Set();
  for (const fee of d.fees ?? []) {
    if (ids.has(fee.id)) err(f, `duplicate fee id ${fee.id}`);
    ids.add(fee.id);
    checkSourced(f, `fees.${fee.id}.amount`, fee.amount);
  }
  if (!(d.fees ?? []).length) err(f, "no fees listed");
}

console.log(`\nChecked ${files.length} state files: ${errors} error(s), ${warnings} warning(s).`);
if (errors > 0) process.exit(1);
