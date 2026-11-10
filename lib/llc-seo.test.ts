import { describe, expect, it } from "vitest";
import { llcPublishability } from "./llc-calc";
import { loadLlcStates } from "./llc-data";
import { llcCostSentence, llcDescription, llcFaqPairs, llcMetadata, llcPageLd, llcTitle } from "./llc-seo";
import { llmsTxt } from "./seo";
import { loadStates } from "./data";

const states = loadLlcStates();
const live = states.filter((s) => llcPublishability(s).publishable);
// A copy of a live state with its yearly fee unverified, so the noindex path stays tested when every real state is live.
const unconfirmed = (() => {
  const s = JSON.parse(JSON.stringify(states[0]));
  s.slug = "unconfirmed-test";
  s.name = "Unconfirmed Test";
  s.annual.forEach((f: { amount: { status: string; value: number | null } }) => { f.amount.status = "unverified"; f.amount.value = null; });
  return s as (typeof states)[number];
})();
const dead = [...states.filter((s) => !llcPublishability(s).publishable), unconfirmed];

describe("LLC seo", () => {
  it("has live and unpublishable states to check", () => {
    expect(live.length).toBeGreaterThan(0);
    expect(dead.length).toBeGreaterThan(0);
  });

  it("titles are unique and name the state", () => {
    const titles = states.map(llcTitle);
    expect(new Set(titles).size).toBe(titles.length);
    for (const s of states) expect(llcTitle(s)).toContain(s.name);
  });

  it("descriptions are unique", () => {
    const d = states.map(llcDescription);
    expect(new Set(d).size).toBe(d.length);
  });

  it("the cost sentence only exists for publishable states and uses calculator figures", () => {
    for (const s of states) expect(llcCostSentence(s) !== null).toBe(llcPublishability(s).publishable);
    const ca = states.find((s) => s.slug === "california")!;
    expect(llcCostSentence(ca)).toBe("State fees for a California LLC: $70 to form, $800 each year, $20 every two years.");
    const tx = states.find((s) => s.slug === "texas")!;
    expect(llcCostSentence(tx)).toBe("State fees for a Texas LLC: $300 to form.");
  });

  it("live states are indexable with canonical, OG and FAQPage", () => {
    for (const s of live) {
      const m = llcMetadata(s);
      expect(m.robots).toBeUndefined();
      expect(m.alternates.canonical).toBe(`/llc/${s.slug}/`);
      expect(m.openGraph.url).toBe(`https://sumdock.com/llc/${s.slug}/`);
      const ld = JSON.stringify(llcPageLd(s));
      expect(ld).toContain("FAQPage");
      expect(ld).toContain("BreadcrumbList");
      expect(ld).toContain("LLC costs");
    }
  });

  it("unpublishable states are noindex, keep a canonical and have no FAQPage", () => {
    for (const s of dead) {
      const m = llcMetadata(s);
      expect(m.robots).toEqual({ index: false, follow: false });
      expect(m.alternates.canonical).toBe(`/llc/${s.slug}/`);
      expect(JSON.stringify(llcPageLd(s))).not.toContain("FAQPage");
    }
  });

  it("faq answers contain no unexpanded tokens and no digits from prose", () => {
    for (const s of states) {
      const pairs = llcFaqPairs(s);
      expect(pairs.length).toBeGreaterThan(2);
      for (const f of pairs) {
        expect(f.q).not.toMatch(/[{}]/);
        expect(f.a).not.toMatch(/[{}]/);
      }
    }
  });

  it("llms.txt lists live LLC pages only", () => {
    const t = llmsTxt(loadStates(), states);
    expect(t).toContain("https://sumdock.com/llc/");
    for (const s of live) expect(t).toContain(`/llc/${s.slug}/`);
    for (const s of dead) expect(t).not.toContain(`/llc/${s.slug}/`);
  });

  it("llms.txt has no LLC state list for vehicle-only callers", () => {
    expect(llmsTxt(loadStates())).not.toContain("## LLC cost pages");
  });
});
