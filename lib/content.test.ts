import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculate } from "./calc";
import { expandTokens, exampleScenarios, figures, generatedFaq, generatedSummary } from "./content";
import { loadStates } from "./data";
import { collectSources, sourcesForLine } from "./sources";
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
