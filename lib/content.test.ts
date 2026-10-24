import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculate } from "./calc";
import { DEFAULT_INPUTS, expandTokens, figures, generatedFaq, tradeInExample, workedExamples } from "./content";
import { loadStates } from "./data";
import { collectSources, sourcesForLine } from "./sources";
import type { StateData } from "./types";

const states = loadStates();

describe.each(states.map((s) => [s.name, s] as const))("%s page content", (_name, s) => {
  it("worked examples are exactly what calculate() returns", () => {
    for (const ex of workedExamples(s)) {
      expect(ex.result).toEqual(calculate(s, ex.inputs));
      expect(ex.inputs.price).toBeGreaterThan(0);
    }
  });

  it("trade-in example matches two calculate() runs", () => {
    const t = tradeInExample(s);
    if (!t) return;
    const find = (tradeIn: number) =>
      calculate(s, { ...DEFAULT_INPUTS, price: t.price, tradeIn }).lines.find((l) => l.id === "state-tax")!.amount;
    expect(t.without).toBe(find(0));
    expect(t.with).toBe(find(t.tradeIn));
    expect(t.with).toBeLessThan(t.without);
  });

  it("every result line has a source to link to", () => {
    for (const ex of workedExamples(s)) {
      for (const l of ex.result.lines) expect(sourcesForLine(s, l.id).length, l.id).toBeGreaterThan(0);
    }
  });

  it("generated FAQ always cites a source", () => {
    for (const f of generatedFaq(s)) expect(f.sources.length).toBeGreaterThan(0);
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
