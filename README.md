# US Vehicle Tax & Fee Calculator

Static Next.js site (`output: "export"`) that estimates sales/use tax, title and registration fees per US state. Every number comes from a per-state JSON file with an official source link and the date it was opened.

Full plan: https://claude.ai/artifact/FEDbF3KgmtrKoMhkE2wUoS (see also `PLAN.md`).

## Commands

```bash
npm install
npm run validate          # check every data file (schema, sources, dates)
npm run validate:strict   # same, but stale sources (>45 days) fail
npm test                  # calculator tests
npm run dev               # local dev server
npm run build             # validate, then export static site to ./out
```

## How accuracy is enforced

- Each value is `{ value, status, sources[], note }`. Status is `verified | partial | conflict | unverified`.
- `verified` needs at least one official (non-secondary) source. `partial` means an official source exists but something is missing (county page, old document, secondary confirmation).
- The calculator only uses `verified` and `partial` values. Anything else is shown to the user as "not included, still being verified". Nothing is guessed.
- A state page is indexable only if state rate, trade-in rule, local rule, a title fee and a registration fee are usable (`publishability()` in `lib/calc.ts`). Otherwise the page is `noindex` and shows a banner.
- `npm run build` fails on schema errors. Run `validate:strict` in CI to catch stale sources.

## Adding a state

1. Copy `data/states/or.json`, rename to the two-letter code.
2. Open the official revenue/DMV pages. Fill each field with the value, the page URL and today's date.
3. Add a test in `lib/calc.test.ts` using an official worked example if one exists.
4. `npm run validate && npm test`.

## Not built yet

Per-state changelog, AdSense, county registration fees for CA, county data for NY/FL, private-party rules, remaining states.

## Hosting (Cloudflare Workers static assets)

- The site is a static export, so Cloudflare only serves the `out/` folder. `wrangler.jsonc` says so; do not let Cloudflare auto-configure OpenNext.
- Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
- Environment variable: `NODE_VERSION=22`.
- Domain: sumdock.com. Add it under the project's Domains and Routes.
- Vercel's free plan is for non-commercial use, so it is not used for this ad-supported site.

## Site layout

- `/` hub listing tools; `/vehicle/` vehicle calculator; `/vehicle/<state>/` one page per state.
- To add another tool, create `app/<tool>/` and add a card in `app/page.tsx` and entries in `app/sitemap.ts`.
