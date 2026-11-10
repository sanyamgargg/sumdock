# Build prompt: LLC cost by state (`/llc/`)

Paste everything below the line into the coding agent in VS Code, from the repo root.

---

You are adding a second calculator to Sumdock (sumdock.com): **what it costs to form and keep an LLC, by US state**. Read `CLAUDE.md` first and follow its accuracy rules exactly; they apply to this tool too. (Its "Current status" section is out of date; the vehicle tool now has 35 states. Read the code, not that section.)

## Goal

A page per state at `/llc/<state-slug>/` that answers, with every number linked to an official source:
1. **One-time cost to form** a domestic LLC (filing fee for the Articles of Organization / Certificate of Formation, plus any other mandatory state fee at formation).
2. **Yearly cost to keep it** (annual or biennial report fee, and any minimum franchise or privilege tax the state charges an LLC).
3. **What is left out** (registered agent if you hire one, name reservation, expedited filing, certified copies, local business licenses, publication costs where a state requires them, federal and income taxes).

Start with five states: **California, Texas, Florida, New York, Delaware**. Do not add others in this task.

## Accuracy rules (non-negotiable)

- Every number lives in a data file with `{ value, status, sources[], note }`, the same `Sourced<T>` shape as `lib/types.ts`. No number in components.
- `verified` only from the state's own Secretary of State, Division of Corporations, Comptroller or revenue agency page or fee schedule. Third-party sites (LegalZoom, Nolo, Northwest, ZenBusiness, blogs) are never sources; at most they hint where to look.
- Open each official page and read the real text before using a number. Record `accessed` as the date you opened it. Never fill a value from memory. If you cannot reach or confirm a page, mark the value `unverified`, explain in `note`, and list it under "Not included" on the page.
- If official pages disagree, mark `conflict` and explain.
- Things to look for and confirm from official pages (do not assume amounts): California's minimum franchise tax for LLCs and any first-year rules; Texas's franchise tax report and its no-tax-due threshold; Florida's annual report fee and late fee; New York's biennial statement fee and the publication requirement (its cost varies by county, so it is "not included" with an explanation); Delaware's annual LLC tax and its due date.
- Online-filing fees, card surcharges and optional expedite fees are "not included" unless the state requires them for every filing.

## Data and code

- New folder `data/llc/<code>.json`, one file per state. Fields: `code`, `name`, `slug`, `lastReviewed`, `formation` (list of fees), `annual` (list of fees, each with a `frequency` of `annual` or `biennial` and a due-date note), `notIncluded` (list of `{ label, reason, sources? }`), `content` (same digit-free prose rules and `{state}` tokens as the vehicle `content` block, every cited URL also appearing as a source in the file).
- Types in `lib/llc-types.ts`; loader `loadLlcStates()` and `loadLlcState(slug)` in `lib/data.ts` (or `lib/llc-data.ts`); calculator logic in `lib/llc-calc.ts` with `calculateLlc()` and `llcPublishability()` (publishable only when the formation filing fee and the main yearly fee are `verified` or `partial`).
- The calculator takes simple inputs: state, and "years to estimate" (1 to 5, default 3). Output: formation total, yearly total, and total over the chosen years, as a Statement-style itemized receipt with footnotes and a sources table. Reuse `components/Statement.tsx`, `SourcesTable.tsx`, `StatusMark.tsx` and the styles in `app/styles/`; do not redesign.
- Extend `scripts/validate-data.mjs` (or add `scripts/validate-llc.mjs` and call it from `npm run validate`) to check every LLC file the same way the vehicle files are checked: required fields, statuses, sources with title, URL, accessed date and publisher type, digit-free content, cited URLs present.
- `scripts/check-sources.mjs` (the monthly source check) must include the LLC source URLs.

## Pages and SEO

- `app/llc/page.tsx`: index of the five states with their status mark, a short plain-English intro, and the methodology link.
- `app/llc/[state]/page.tsx`: calculator, "How {state} charges an LLC" section, FAQ, sources, "What changed". Canonical `/llc/<slug>/`, unique title and description, breadcrumbs, FAQPage JSON-LD like the vehicle pages. Unpublishable states get `noindex` and stay out of the sitemap.
- Add `/llc/` and published LLC state pages to `app/sitemap.ts`, to `app/llms.txt`, to the home page's tools list, and to the header navigation.
- Changelog: add an entry per state to `data/changelog.json` (extend the entry type with a `tool` field, `"vehicle"` or `"llc"`, defaulting existing entries to vehicle) and show the tool name on `/changelog/`.
- Methodology page: add a short LLC section saying which agencies are used and what is left out.

## Tests

- `lib/llc-calc.test.ts`: for each state, publishability, formation total, yearly total and the multi-year total; a test that unverified items are excluded and listed; a test that biennial fees are counted correctly over 1 to 5 years.
- Content and SEO tests mirroring `lib/content.test.ts` and `lib/seo.test.ts` (canonical, noindex for unpublishable, digit-free content, cited URLs present).
- Run `npm run validate && npm test` and `npx tsc --noEmit` until all pass. Do not weaken or delete existing vehicle tests.

## Style

Plain US English, no marketing claims, "estimate" not "exact". Say clearly that this is not legal or tax advice and that federal and state income taxes are not included.

## When you finish

Report, per state: each fee with its value, status and the official URL it came from, and anything you marked unverified and why. List files added and changed. Commit on a branch named `llc-tool` with a clear message; do not push to `main`.
