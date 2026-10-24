# Sumdock (sumdock.com)

Ad-supported calculator site. First tool: US vehicle tax and fee calculator at `/vehicle/`. Owner: Sanyam Garg, full-stack developer. Contact: hello@sumdock.com. The goal is a trustworthy site that can pass an AdSense review, so accuracy and original content matter more than page count.

## Stack
Next.js 15 App Router, `output: "export"` (static), TypeScript, React 19, vitest. Node 22.
Hosted on Cloudflare Workers static assets (`wrangler.jsonc` serves `out/`). Build command `npm run build`, deploy command `npx wrangler deploy`, variable `NODE_VERSION=22`. Do not let Cloudflare auto-configure OpenNext; this is a static export.

## Commands
- `npm run validate` checks every data file. `npm run validate:strict` also fails on sources older than 45 days.
- `npm test` runs calculator and data tests.
- `npm run dev` for local development. `npm run build` validates, then exports to `out/`.

## Accuracy rules (do not break)
1. Every number lives in `data/states/<code>.json` as `{ value, status, sources[], note }`. No number is hard-coded in components.
2. Status is `verified | partial | conflict | unverified`. `verified` needs an official, non-secondary source (state agency). Only verified and partial values enter totals; everything else is listed as "Not included, still being verified".
3. Never guess or fill a gap from memory. If official pages disagree or no official source exists, mark `conflict` or `unverified` and explain in `note`.
4. Each source has a title, URL and the `accessed` date it was opened. Re-open the page when you update a value.
5. A state page is indexable only if `publishability()` passes (state rate, trade-in rule, local rule, a title fee and a registration fee). Otherwise it is noindex with a banner and left out of the sitemap.
6. Add or change a test in `lib/calc.test.ts` for every data change. Prefer official worked examples.
7. Official PDFs and agency pages can be summarised wrongly by tools. Read the real text and check counts and totals against the source.

## Data model
- `lib/types.ts`: `StateData`, `Sourced<T>`, `Fee` (kinds: flat, percentOfValue, weightTable, valueTable), `counties` (per-county fee, Texas), `localRates` (county/city rates used to fill the local tax rate: mode `combined` subtracts the state rate, `localOnly` uses the rate as is).
- `lib/calc.ts`: `calculate()` and `publishability()`.
- `components/Calculator.tsx`: the client calculator.

## Adding a state
Copy `data/states/or.json`, rename to the two-letter code, fill each field from official revenue and DMV pages, add tests, then `npm run validate && npm test`. Add the state's county or city rates to `localRates` when the state has local taxes.

## Current status
Five states live: TX (with 254 county fees), CA (58 counties, 331 cities), FL (67 county surtax rates), NY (58 county rates), OR. See `PILOT-STATUS.md` for weak spots per state. Known gaps: county registration fees for CA, NY commuter-district fee and county use tax, FL county registration fee.

## Roadmap
1. UI polish and mobile layout; explanatory content and worked examples on each state page.
2. More states, largest first (PA, IL, OH, GA, NC, MI).
3. Monthly check for changed pages, full re-verification each January and July.
4. Apply to AdSense after the site has been live for several weeks with more than five states and original content.

## Style
Plain English, US spelling, no marketing claims. Pages must say what is estimated and what is left out. Keep copy honest: "estimate", not "exact".
