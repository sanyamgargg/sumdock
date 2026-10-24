import { describe, expect, it } from "vitest";
import { publishability } from "./calc";
import { loadStates } from "./data";
import { answerSentence, faqPairs, llmsTxt, siteLd, stateDescription, stateMetadata, statePageLd, stateTitle } from "./seo";

const states = loadStates();
const live = states.filter((s) => publishability(s).publishable);
const tx = states.find((s) => s.slug === "texas")!;

describe("seo", () => {
  it("title carries the state rate for a taxed state", () => {
    expect(stateTitle(tx)).toContain("Texas");
    expect(stateTitle(tx)).toContain("6.25%");
  });
  it("description for a live state includes a computed example total and the review date", () => {
    expect(stateDescription(tx)).toMatch(/\$[\d,]+\.\d\d in taxes and fees/);
    expect(stateDescription(tx)).toContain("Oct");
  });
  it("answer sentence only exists for publishable states", () => {
    for (const s of states) expect(answerSentence(s) !== null).toBe(publishability(s).publishable);
  });
  it("unpublishable states are noindex and have no FAQPage", () => {
    for (const s of states.filter((x) => !publishability(x).publishable)) {
      expect(stateMetadata(s).robots).toEqual({ index: false, follow: false });
      expect(JSON.stringify(statePageLd(s))).not.toContain("FAQPage");
    }
  });
  it("live states are indexable with canonical, OG and FAQPage", () => {
    for (const s of live) {
      const m = stateMetadata(s);
      expect(m.robots).toBeUndefined();
      expect(m.alternates.canonical).toBe(`/vehicle/${s.slug}/`);
      expect(m.openGraph.url).toBe(`https://sumdock.com/vehicle/${s.slug}/`);
      expect(JSON.stringify(statePageLd(s))).toContain("FAQPage");
      expect(faqPairs(s).length).toBeGreaterThan(0);
    }
  });
  it("faq answers contain no unexpanded tokens", () => {
    for (const s of states) for (const f of faqPairs(s)) expect(f.a).not.toMatch(/[{}]/);
  });
  it("site graph and llms.txt are well formed", () => {
    expect(JSON.stringify(siteLd())).toContain("WebSite");
    const t = llmsTxt(states);
    expect(t.startsWith("# Sumdock")).toBe(true);
    for (const s of live) expect(t).toContain(`/vehicle/${s.slug}/`);
    for (const s of states.filter((x) => !publishability(x).publishable)) expect(t).not.toContain(`/vehicle/${s.slug}/`);
  });
});
