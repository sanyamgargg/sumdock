// Monthly source check: opens every source URL used in data/states/*.json,
// hashes the readable text, and compares it with data/source-snapshots.json.
// Writes a Markdown report to source-report.md when anything changed or failed.
// Usage: node scripts/check-sources.mjs [--list]   (--list only prints the URLs)
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const DIR = "data/states";
const SNAP = "data/source-snapshots.json";
const today = new Date().toISOString().slice(0, 10);

function collect(node, out, file) {
  if (Array.isArray(node)) return node.forEach((n) => collect(n, out, file));
  if (node && typeof node === "object") {
    if (typeof node.url === "string" && node.url.startsWith("http") && node.accessed) {
      const e = out.get(node.url) ?? { title: node.title, states: new Set() };
      e.states.add(file.replace(".json", "").toUpperCase());
      out.set(node.url, e);
    }
    Object.values(node).forEach((n) => collect(n, out, file));
  }
}

const urls = new Map();
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  collect(JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")), urls, f);
}
if (process.argv.includes("--list")) {
  for (const [u, e] of urls) console.log(`${[...e.states].join(",")}\t${u}`);
  console.log(`\n${urls.size} unique source URLs`);
  process.exit(0);
}

const snaps = existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, "utf8")) : {};

function normalize(buf, type) {
  if (!/html|text|xml|json/i.test(type)) return buf; // PDFs etc.: hash the bytes
  return Buffer.from(
    buf.toString("utf8")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

async function check(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; SumdockSourceCheck/1.0; +https://sumdock.com)" },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = createHash("sha256").update(normalize(buf, res.headers.get("content-type") ?? "")).digest("hex");
    return { status: res.status, hash };
  } catch (e) {
    return { status: 0, error: String(e.cause?.code ?? e.message ?? e) };
  } finally {
    clearTimeout(t);
  }
}

const changed = [], failed = [], added = [];
const list = [...urls.entries()];
for (let i = 0; i < list.length; i += 5) {
  await Promise.all(list.slice(i, i + 5).map(async ([url, e]) => {
    const r = await check(url);
    const prev = snaps[url];
    if (r.status < 200 || r.status >= 300) {
      failed.push({ url, e, why: r.error ?? `HTTP ${r.status}` });
      return; // keep the old snapshot
    }
    if (!prev) added.push({ url, e });
    else if (prev.hash !== r.hash) changed.push({ url, e, since: prev.checked });
    snaps[url] = { hash: r.hash, checked: today };
  }));
}
for (const u of Object.keys(snaps)) if (!urls.has(u)) delete snaps[u];
writeFileSync(SNAP, JSON.stringify(snaps, null, 2) + "\n");

const row = ({ url, e, since, why }) =>
  `- **${[...e.states].join(", ")}** ${e.title}\n  ${url}${since ? `\n  last seen unchanged ${since}` : ""}${why ? `\n  problem: ${why}` : ""}`;
let md = `# Source check ${today}\n\nChecked ${urls.size} source pages.\n`;
if (changed.length) md += `\n## Changed (${changed.length}) — open each page and compare with the data file\n\n${changed.map(row).join("\n")}\n`;
if (failed.length) md += `\n## Could not be opened (${failed.length}) — check by hand\n\n${failed.map(row).join("\n")}\n`;
if (added.length) md += `\n## First snapshot (${added.length}) — baseline only\n\n${added.length} pages recorded for the first time.\n`;
writeFileSync("source-report.md", md);
console.log(md);
// Flag only things a person must look at (not first-time baselines).
writeFileSync("source-report.flag", changed.length || failed.length ? "yes" : "no");
