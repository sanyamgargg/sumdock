import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateLlc, llcPublishability } from "./llc-calc";
import { generatedLlcFaq, llcCostSummary, llcFigures, llcVerification, expandLlcTokens, llcSourcesByUrl } from "./llc-content";
import { loadLlcStates } from "./llc-data";
import { collectLlcSources, llcFootnotes, llcSourcesForLine } from "./llc-sources";
import type { LlcState } from "./llc-types";

const states = loadLlcStates();

const urlsIn = (o: unknown, out = new Set<string>()): Set<string> => {
  if (Array.isArray(o)) o.forEach((x) => urlsIn(x, out));
  else if (o && typeof o === "object") {
    const r = o as Record<string, unknown>;
    if (Array.isArray(r.sources)) for (const s of r.sources) if (s && typeof s === "object" && "url" in s) out.add((s as { url: string }).url);
    for (const [k, v] of Object.entries(r)) if (k !== "content") urlsIn(v, out);
  }
  return out;
};

const proseOf = (s: LlcState): string[] => {
  const c = s.content!;
  return [c.intro ?? "", ...(c.howItWorks ?? []).map((b) => b.text), ...(c.faq ?? []).flatMap((f) => [f.q, f.text])];
};

describe.each(states.map((s) => [s.name, s] as const))("%s LLC page content", (_name, s) => {
  it("has written content", () => {
    expect(s.content?.intro).toBeTruthy();
    expect(s.content?.howItWorks?.length).toBeGreaterThan(0);
    expect(s.content?.faq?.length).toBeGreaterThan(0);
  });

  it("prose has no digits, so figures cannot drift from the data", () => {
    for (const t of proseOf(s)) expect(t.replaceAll("{state}", "")).not.toMatch(/\d/);
  });

  it("the only token is {state}, and it expands", () => {
    for (const t of proseOf(s)) {
      expect(t.replaceAll("{state}", "")).not.toMatch(/[{}]/);
      expect(expandLlcTokens(t, s)).not.toMatch(/[{}]/);
    }
  });

  it("every cited URL is also a source in the file, and resolves to a source", () => {
    const urls = urlsIn(s);
    const c = s.content!;
    for (const b of [...(c.howItWorks ?? []), ...(c.faq ?? [])]) {
      expect(b.sources.length).toBeGreaterThan(0);
      for (const u of b.sources) expect(urls.has(u), u).toBe(true);
      expect(llcSourcesByUrl(s, b.sources).length).toBe(b.sources.length);
    }
  });

  it("every statement line has a source and a footnote", () => {
    const r = calculateLlc(s, 3);
    const notes = llcFootnotes(s, r.lines.map((l) => l.id));
    for (const l of r.lines) {
      expect(llcSourcesForLine(s, l.id).length, l.id).toBeGreaterThan(0);
      expect(notes.byLine[l.id].length).toBeGreaterThan(0);
    }
    expect(notes.ordered.length).toBe(collectLlcSources(s).length);
  });

  it("footnotes follow statement order and shared sources share a number", () => {
    const r = calculateLlc(s, 3);
    const notes = llcFootnotes(s, r.lines.map((l) => l.id));
    const first = notes.byLine[r.lines[0].id][0];
    expect(first).toBe(1);
    for (const l of r.lines) for (const n of notes.byLine[l.id]) expect(notes.ordered[n - 1].source.url).toBeTruthy();
  });

  it("the figures list matches the fees in the file", () => {
    expect(llcFigures(s).length).toBe(s.formation.length + s.annual.length);
  });

  it("every source is an official page: none is secondary, all have a date", () => {
    for (const { source } of collectLlcSources(s)) {
      expect(source.publisherType).not.toBe("secondary");
      expect(source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("status and summary follow publishability", () => {
    const pub = llcPublishability(s).publishable;
    expect(llcVerification(s).status === "in-review").toBe(!pub);
    expect(llcCostSummary(s)).toContain(pub ? "to form" : "not confirmed");
  });

  it("generated FAQ lists what is left out and says this is not legal or tax advice", () => {
    const faq = generatedLlcFaq(s);
    expect(faq.some((f) => /legal or tax advice/i.test(f.q) && /^No\./.test(f.a) && /income taxes are not included/.test(f.a))).toBe(true);
    expect(faq.find((f) => /leave out/.test(f.q))!.a).toContain(s.notIncluded[0].label);
  });

  it("not-included items always cover income taxes and the optional extras", () => {
    const labels = s.notIncluded.map((n) => n.label).join("|");
    expect(labels).toMatch(/income taxes/i);
    expect(labels).toMatch(/registered agent/i);
    expect(labels).toMatch(/local business licenses/i);
  });
});

describe("data files", () => {
  it("file names match state codes", () => {
    for (const f of readdirSync("data/llc")) {
      const d = JSON.parse(readFileSync(`data/llc/${f}`, "utf8"));
      expect(f.replace(".json", "").toUpperCase()).toBe(d.code);
    }
  });
});
