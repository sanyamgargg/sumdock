import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculate, publishability } from "./calc";
import { DEFAULT_INPUTS, expandTokens, exampleScenarios, figures, generatedFaq, generatedSummary, mainTaxSummary, verificationStatus } from "./content";
import { loadStates } from "./data";
import { collectSources, footnotes, sourcesForLine, splitTitle } from "./sources";
import type { StateData } from "./types";

const states = loadStates();

describe.each(states.map((s) => [s.name, s] as const))("%s page content", (_name, s) => {
  it("scenarios are exactly what calculate() returns", () => {
    const sc = exampleScenarios(s);
    expect(sc.length).toBe(3);
    for (const x of sc) {
      expect(x.result).toEqual(calculate(s, x.inputs));
      expect(x.inputs.price).toBeGreaterThan(0);
    }
  });

  it("a trade-in scenario only appears when it really lowers the sales tax, and its sentence uses calculate() figures", () => {
    const t = exampleScenarios(s).find((x) => x.inputs.tradeIn > 0);
    if (!t) return;
    const base = calculate(s, { ...t.inputs, tradeIn: 0 }).lines.find((l) => l.id === "state-tax")!.amount;
    const withT = t.result.lines.find((l) => l.id === "state-tax")!.amount;
    expect(withT).toBeLessThan(base);
    expect(t.description).toContain((base - withT).toLocaleString("en-US", { style: "currency", currency: "USD" }));
  });

  it("an electric scenario only appears for states with an EV fee", () => {
    const hasEv = s.fees.some((f) => f.when?.fuel === "ev" || f.minForEv !== undefined);
    expect(exampleScenarios(s).some((x) => x.inputs.fuel === "ev")).toBe(hasEv);
  });

  it("every result line in every scenario has a source to link to", () => {
    for (const x of exampleScenarios(s)) {
      for (const l of x.result.lines) expect(sourcesForLine(s, l.id).length, l.id).toBeGreaterThan(0);
    }
  });

  it("summary quotes the state rate straight from the data", () => {
    const rate = s.salesTax.stateRatePct.value;
    expect(generatedSummary(s).join(" ")).toContain(`${rate}%`);
  });

  it("generated FAQ always cites a source", () => {
    for (const f of generatedFaq(s)) expect(f.sources.length > 0 || !!f.link, f.q).toBe(true);
  });

  it("figures list one row per rule and fee", () => {
    expect(figures(s).length).toBeGreaterThanOrEqual(3 + s.fees.length);
  });

  it("sources table has no duplicate URLs", () => {
    const urls = collectSources(s).map((x) => x.source.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("generated FAQ skips unconfirmed rules", () => {
  it("drops the trade-in answer when the status is not usable", () => {
    const base = states.find((x) => x.slug === "texas")!;
    const copy: StateData = structuredClone(base);
    copy.salesTax.tradeInReducesBase.status = "unverified";
    expect(generatedFaq(copy).some((f) => f.q.startsWith("Does a trade-in"))).toBe(false);
    expect(generatedFaq(base).some((f) => f.q.startsWith("Does a trade-in"))).toBe(true);
  });
});

describe("content tokens", () => {
  it("fill the state name and rate from the data file", () => {
    const s = states.find((x) => x.slug === "texas")!;
    const rate = s.salesTax.stateRatePct.value;
    expect(expandTokens("{state} charges {stateRate}.", s)).toBe(`${s.name} charges ${rate}%.`);
  });
});

describe("validate-data content check", () => {
  it("rejects prose with digits, missing sources or unknown source URLs", async () => {
    const { spawnSync } = await import("node:child_process");
    const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const base = JSON.parse(readFileSync("data/states/or.json", "utf8"));
    const script = join(process.cwd(), "scripts", "validate-data.mjs");
    const run = (content: unknown) => {
      const root = mkdtempSync(join(tmpdir(), "sumdock-"));
      mkdirSync(join(root, "data", "states"), { recursive: true });
      writeFileSync(join(root, "data", "states", "or.json"), JSON.stringify({ ...base, content }));
      return spawnSync("node", [script], { cwd: root, encoding: "utf8" });
    };
    const url = base.salesTax.stateRatePct.sources[0].url;
    const ok = run({ howItWorks: [{ text: "{state} applies {stateRate}.", sources: [url] }] });
    expect(ok.status, ok.stderr).toBe(0);
    expect(run({ howItWorks: [{ text: "It costs 5 dollars.", sources: [url] }] }).status).toBe(1);
    expect(run({ howItWorks: [{ text: "No source given.", sources: [] }] }).status).toBe(1);
    expect(run({ howItWorks: [{ text: "Wrong source.", sources: ["https://example.com/x"] }] }).status).toBe(1);
  });
});

describe("verificationStatus", () => {
  it("is in-review exactly when the state is not publishable", () => {
    for (const s of states) {
      expect(verificationStatus(s).status === "in-review", s.name).toBe(!publishability(s).publishable);
    }
  });

  it("is verified only when every value that enters totals is verified", () => {
    for (const s of states) {
      const v = verificationStatus(s);
      if (v.status !== "verified") continue;
      const st = s.salesTax;
      for (const x of [st.stateRatePct, st.tradeInReducesBase, st.local, ...s.fees.map((f) => f.amount)]) {
        if (x.status === "partial") throw new Error(`${s.name} reported verified with a partial value`);
      }
    }
  });

  it("downgrades a verified state when one value becomes partial", () => {
    const base = states.find((x) => verificationStatus(x).status === "verified");
    if (!base) return;
    const copy: StateData = structuredClone(base);
    copy.salesTax.stateRatePct.status = "partial";
    expect(verificationStatus(copy).status).toBe("partial");
  });
});

describe("statement footnotes", () => {
  it.each(states.map((s) => [s.name, s] as const))("%s: numbers follow line order and shared sources share a number", (_n, s) => {
    const county = s.counties?.fees.value ? Object.keys(s.counties.fees.value)[0] : "";
    const result = calculate(s, { ...DEFAULT_INPUTS, county, localRatePct: 1 });
    const ids = result.lines.map((l) => l.id);
    const fn = footnotes(s, ids);
    // Every source in the file is listed exactly once, numbered 1..n.
    const urls = fn.ordered.map((x) => x.source.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.length).toBe(collectSources(s).length);
    // A line's numbers point at its own sources.
    for (const id of ids) {
      const expected = sourcesForLine(s, id).map((src) => urls.indexOf(src.url) + 1);
      expect(fn.byLine[id]).toEqual([...new Set(expected)]);
    }
    // First appearance order: no line introduces a number more than one above everything seen before it.
    let seen = 0;
    for (const id of ids) {
      for (const n of fn.byLine[id]) {
        expect(n).toBeLessThanOrEqual(seen + 1);
        seen = Math.max(seen, n);
      }
    }
  });

  it("two lines that cite the same page get the same number", () => {
    const tx = states.find((s) => s.slug === "texas")!;
    const result = calculate(tx, { ...DEFAULT_INPUTS, county: "Travis" });
    const fn = footnotes(tx, result.lines.map((l) => l.id));
    const shared = Object.values(fn.byLine).flat();
    expect(shared.length).toBeGreaterThan(new Set(shared).size);
  });
});

describe("splitTitle", () => {
  it("splits the publisher from the page name", () => {
    expect(splitTitle("TxDMV - Title Manual")).toEqual({ publisher: "TxDMV", page: "Title Manual" });
    expect(splitTitle("Title Manual")).toEqual({ publisher: null, page: "Title Manual" });
  });
});

describe("mainTaxSummary", () => {
  it.each(states.map((s) => [s.name, s] as const))("%s: starts from the data file's own rate", (_n, s) => {
    const text = mainTaxSummary(s);
    const rate = s.salesTax.stateRatePct.value;
    if (rate === 0) expect(text).toMatch(/^No sales tax/);
    else expect(text.startsWith(`${rate}% sales tax`)).toBe(true);
    if (verificationStatus(s).status === "in-review") expect(text).toContain("not confirmed");
  });

  it("describes the kind of local rate", () => {
    const by = (slug: string) => states.find((s) => s.slug === slug)!;
    expect(mainTaxSummary(by("florida"))).toContain("county surtax");
    expect(mainTaxSummary(by("texas"))).toBe(`${by("texas").salesTax.stateRatePct.value}% sales tax`);
  });
});
