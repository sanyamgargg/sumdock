// Monthly source check: opens every source URL used in data/states/*.json and data/llc/*.json,
// hashes the readable text, and compares it with data/source-snapshots.json.
// Writes a Markdown report to source-report.md when anything changed or failed.
// Sites that refuse automated requests (403, 429, a bot-check page) are listed as "blocked" and only flagged
// once the data that cites them is older than BLOCKED_STALE_DAYS, since they cannot be checked by a script.
// Broken links (404, DNS errors, timeouts) are retried once before they are reported.
// Usage: node scripts/check-sources.mjs [--list]   (--list only prints the URLs)
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const DIRS = [["data/states", ""], ["data/llc", "LLC "]];
const SNAP = "data/source-snapshots.json";
const today = new Date().toISOString().slice(0, 10);
const BLOCKED_STALE_DAYS = 90;
const daysSince = (d) => Math.floor((Date.parse(today) - Date.parse(d)) / 864e5);

function collect(node, out, file, prefix) {
  if (Array.isArray(node)) return node.forEach((n) => collect(n, out, file, prefix));
  if (node && typeof node === "object") {
    if (typeof node.url === "string" && node.url.startsWith("http") && node.accessed) {
      const e = out.get(node.url) ?? { title: node.title, states: new Set(), accessed: node.accessed };
      e.states.add(prefix + file.replace(".json", "").toUpperCase());
      if (node.accessed < e.accessed) e.accessed = node.accessed; // oldest date the page was read for this data
      out.set(node.url, e);
    }
    Object.values(node).forEach((n) => collect(n, out, file, prefix));
  }
}

const urls = new Map();
for (const [dir, prefix] of DIRS) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    collect(JSON.parse(readFileSync(`${dir}/${f}`, "utf8")), urls, f, prefix);
  }
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
    const text = buf.toString("utf8", 0, Math.min(buf.length, 20000));
    if (/<title>\s*Just a moment\.\.\.\s*<\/title>|cf-chl|challenge-platform/i.test(text)) return { status: res.status, blocked: true, error: "bot check page" };
    if ([401, 403, 429].includes(res.status)) return { status: res.status, blocked: true, error: `HTTP ${res.status}` };
    const hash = createHash("sha256").update(normalize(buf, res.headers.get("content-type") ?? "")).digest("hex");
    return { status: res.status, hash };
  } catch (e) {
    return { status: 0, error: String(e.cause?.code ?? e.message ?? e) };
  } finally {
    clearTimeout(t);
  }
}

const changed = [], failed = [], blocked = [], added = [];
const list = [...urls.entries()];
for (let i = 0; i < list.length; i += 5) {
  await Promise.all(list.slice(i, i + 5).map(async ([url, e]) => {
    let r = await check(url);
    if (!r.blocked && (r.status < 200 || r.status >= 300)) {
      await new Promise((ok) => setTimeout(ok, 5000));
      r = await check(url); // one retry: a 404 or timeout is often temporary
    }
    const prev = snaps[url];
    if (r.blocked) {
      blocked.push({ url, e, why: r.error, stale: daysSince(e.accessed) > BLOCKED_STALE_DAYS });
      return; // keep the old snapshot
    }
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
  `- **${[...e.states].join(", ")}** ${e.title}\n  ${url}${since ? `\n  last seen unchanged ${since}` : ""}${why ? `\n  problem: ${why}` : ""}\n  data last checked against it: ${e.accessed}`;
const staleBlocked = blocked.filter((b) => b.stale);
let md = `# Source check ${today}\n\nChecked ${urls.size} source pages.\n`;
if (changed.length) md += `\n## Changed (${changed.length}) — open each page and compare with the data file\n\n${changed.map(row).join("\n")}\n`;
if (failed.length) md += `\n## Broken links (${failed.length}) — failed twice; find the new address\n\n${failed.map(row).join("\n")}\n`;
if (staleBlocked.length) md += `\n## Blocked and due for a manual check (${staleBlocked.length}) — the site refuses scripts and the data is over ${BLOCKED_STALE_DAYS} days old\n\n${staleBlocked.map(row).join("\n")}\n`;
if (blocked.length - staleBlocked.length) md += `\n## Blocked, not yet due (${blocked.length - staleBlocked.length}) — these sites refuse automated requests; checked by hand within the last ${BLOCKED_STALE_DAYS} days\n\n${blocked.filter((b) => !b.stale).map((b) => `- ${[...b.e.states].join(", ")}: ${b.url} (${b.why}, data checked ${b.e.accessed})`).join("\n")}\n`;
if (added.length) md += `\n## First snapshot (${added.length}) — baseline only\n\n${added.length} pages recorded for the first time.\n`;
writeFileSync("source-report.md", md);
console.log(md);
// Flag only things a person must look at (not first-time baselines).
writeFileSync("source-report.flag", changed.length || failed.length || staleBlocked.length ? "yes" : "no");
