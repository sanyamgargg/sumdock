// Validates every data/llc/*.json file, the same way validate-data.mjs checks the vehicle files.
// Errors fail the build. Warnings are printed. --strict turns stale-source warnings into errors.
import fs from "node:fs";
import path from "node:path";

const strict = process.argv.includes("--strict");
const MAX_AGE_DAYS = 45;
const STATUSES = ["verified", "partial", "conflict", "unverified"];
const PUBLISHERS = ["state-agency", "county-agency", "secondary"];
const FREQUENCIES = ["once", "annual", "biennial"];
const dir = path.join(process.cwd(), "data", "llc");

let errors = 0;
let warnings = 0;
const err = (f, m) => { errors++; console.error(`ERROR  llc/${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.warn(`WARN   llc/${f}: ${m}`); };

const today = new Date();
const ageDays = (iso) => (today - new Date(iso)) / 86400000;

function checkSources(file, where, sources) {
  for (const src of sources) {
    if (!/^https?:\/\//.test(src.url ?? "")) err(file, `${where}: bad source url`);
    if (!src.title) err(file, `${where}: source missing title`);
    if (!PUBLISHERS.includes(src.publisherType)) err(file, `${where}: source ${src.url} has bad publisherType "${src.publisherType}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(src.accessed ?? "")) err(file, `${where}: source missing accessed date`);
    else if (ageDays(src.accessed) > MAX_AGE_DAYS) {
      (strict ? err : warn)(file, `${where}: source ${src.url} last opened ${src.accessed} (>${MAX_AGE_DAYS} days)`);
    }
  }
}

function checkSourced(file, where, s) {
  if (!s || typeof s !== "object") return err(file, `${where}: missing`);
  if (!STATUSES.includes(s.status)) err(file, `${where}: bad status "${s.status}"`);
  if (!Array.isArray(s.sources)) return err(file, `${where}: sources must be an array`);
  const usable = s.status === "verified" || s.status === "partial";
  if (usable && (typeof s.value !== "number" || s.value < 0)) err(file, `${where}: status ${s.status} needs a value that is a number, zero or more`);
  if (!usable && s.value !== null) err(file, `${where}: status ${s.status} must have a null value`);
  if (usable && s.sources.length === 0) err(file, `${where}: ${s.status} value has no source`);
  if (s.status === "verified" && !s.sources.some((x) => x.publisherType !== "secondary"))
    err(file, `${where}: "verified" needs at least one official (non-secondary) source`);
  if (s.status === "conflict" && !(s.alt && s.alt.length >= 2)) err(file, `${where}: conflict needs alt values`);
  if (s.status !== "verified" && !(typeof s.note === "string" && s.note.trim())) err(file, `${where}: ${s.status} value needs a note that explains why`);
  checkSources(file, where, s.sources);
}

function collectUrls(o, out = new Set()) {
  if (Array.isArray(o)) o.forEach((x) => collectUrls(x, out));
  else if (o && typeof o === "object") {
    if (Array.isArray(o.sources)) for (const s of o.sources) if (s && typeof s === "object" && s.url) out.add(s.url);
    for (const [k, v] of Object.entries(o)) if (k !== "content") collectUrls(v, out);
  }
  return out;
}

// Hand-written prose: no digits, and {state} is the only token.
function checkText(file, where, text) {
  if (typeof text !== "string" || text.trim() === "") return err(file, `${where}: must be a non-empty string`);
  const stripped = text.replace(/\{state\}/g, "");
  if (/\d/.test(stripped)) err(file, `${where}: contains a digit; figures come from the data fields, not the prose`);
  if (/[{}]/.test(stripped)) err(file, `${where}: unknown token (allowed: {state})`);
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
      checkText(file, `content.faq[${n}].q`, b?.q);
    });
  }
}

function checkFees(file, where, fees, kind) {
  if (!Array.isArray(fees) || fees.length === 0) return err(file, `${where}: needs at least one fee`);
  for (const fee of fees) {
    const w = `${where}.${fee.id}`;
    if (!fee.id) err(file, `${where}: fee missing id`);
    if (!fee.label) err(file, `${w}: missing label`);
    if (!FREQUENCIES.includes(fee.frequency)) err(file, `${w}: bad frequency "${fee.frequency}"`);
    if (kind === "formation" && fee.frequency !== "once") err(file, `${w}: formation fees must be frequency "once"`);
    if (kind === "annual") {
      if (fee.frequency === "once") err(file, `${w}: yearly fees must be annual or biennial`);
      if (typeof fee.due !== "string" || !fee.due.trim()) err(file, `${w}: yearly fees need a due-date note`);
    }
    if (fee.firstYear !== undefined && !(Number.isInteger(fee.firstYear) && fee.firstYear >= 1 && fee.firstYear <= 5)) err(file, `${w}: firstYear must be a whole number from 1 to 5`);
    checkSourced(file, `${w}.amount`, fee.amount);
  }
  if (fees.filter((f) => f.main).length !== 1) err(file, `${where}: exactly one fee must be marked main`);
}

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
if (files.length === 0) err("data/llc", "no LLC files found");

const slugs = new Set();
for (const f of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
  catch (e) { err(f, `invalid JSON: ${e.message}`); continue; }

  for (const k of ["code", "name", "slug", "lastReviewed"]) if (!d[k]) err(f, `missing ${k}`);
  if (slugs.has(d.slug)) err(f, `duplicate slug ${d.slug}`);
  slugs.add(d.slug);
  if (f.replace(".json", "").toUpperCase() !== d.code) err(f, "file name must match state code");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.lastReviewed ?? "")) err(f, "lastReviewed must be an ISO date");

  checkFees(f, "formation", d.formation, "formation");
  checkFees(f, "annual", d.annual, "annual");
  const ids = [...(d.formation ?? []), ...(d.annual ?? [])].map((x) => x.id);
  if (new Set(ids).size !== ids.length) err(f, "duplicate fee id");

  if (!Array.isArray(d.notIncluded) || d.notIncluded.length === 0) err(f, "notIncluded: needs at least one item");
  else d.notIncluded.forEach((n, i) => {
    if (!n.label || !n.reason) err(f, `notIncluded[${i}]: needs label and reason`);
    if (/[{}]/.test(`${n.label}${n.reason}`)) err(f, `notIncluded[${i}]: tokens are not expanded here; write the state name`);
    if (n.sources !== undefined) checkSources(f, `notIncluded[${i}]`, n.sources);
  });

  if (d.content !== undefined) checkContent(f, d);
}

console.log(`\nChecked ${files.length} LLC files: ${errors} error(s), ${warnings} warning(s).`);
if (errors > 0) process.exit(1);
