# Prompt for Claude Code: redesign Sumdock to the "Statement" direction

Paste everything below the line into Claude Code, run from the repo root.

---

Read `CLAUDE.md` first, then `design/README.md`. Redesign the whole site visually to match the references in `design/reference/`. The current look is too plain and reads as a student project, so this is a full visual rebuild, not a touch-up. Do not change what the calculator computes.

**References (open them, look at the PNGs too)**
- `design/reference/state-page-desktop.html` and `.png`: the state page, the most important screen.
- `design/reference/state-page-phone.html` and `.png`: the same page at 390 px.
- `design/reference/home.html` and `.png`: home page.
- `design/reference/state-index.html` and `.png`: the `/vehicle/` list of states.

`design/README.md` has the tokens (colors, fonts, type scale), the components to build, and the accessibility rules. Follow them exactly. The numbers in the references are samples; in the app every figure must come from `lib/calc.ts` and `data/states/*.json`.

**What to do**
1. Replace the old teal theme in `app/globals.css` with the tokens from `design/README.md` as CSS variables. Load IBM Plex Sans and IBM Plex Mono with `next/font/google` (no `<link>` tags). Square corners everywhere, 1 px ink borders on panels.
2. Rebuild these as components, matching the references: site header and footer, purchase form, statement panel (rows with dotted leaders, numbered footnotes, double rule, big total, "Not included" box), sources table, status mark, state index rows, home hero with a sample statement card rendered from the real Texas calculation at build time, FAQ rows.
3. Footnote numbers: number the sources in the order the lines appear in the statement. Lines sharing a source share a number. Each `[n]` links to its row in the sources table (use `lib/sources.ts` and the existing `Result` lines).
4. Status words and glyphs: Verified (solid square), Partly verified (square with a 2 px accent border), In review (dashed gray square, row is not a link). Always show the word. Use `verificationStatus()` from `lib/content.ts`.
5. Keep all behavior: county and city pickers (including New York's single picker that also sets the county fee), the trade-in cap, `localRates`, content blocks, the "What changed" list from `data/changelog.json` (add it to the state page if it is not shown yet, under Sources), indexing and noindex rules, sitemap, ad slots. Do not edit `data/`, `lib/calc.ts`, `lib/types.ts` or the validator unless a bug forces it, and say so if you do.
6. Phone: follow `state-page-phone.html` (single column, statement rows wrap, 44 px touch targets, no horizontal page scroll). The nav collapses into a menu button.
7. Home copy and the "Government sources only" wording are already updated in the repo; keep that wording. The home page lists the live states from the data, not a hardcoded list.
8. Accessibility: real labels, buttons and links, a visible 2 px accent focus outline, contrast of at least 4.5:1, `aria-live="polite"` on the statement panel, no emoji.

**Working rules**
- Run `git status` first. If there are uncommitted changes from earlier work, look at them, keep what belongs to the redesign, and commit that separately before you start.
- Work in small commits (tokens and fonts, header and footer, form, statement, sources, index, home, phone).
- After each major step run `npm run validate`, `npx vitest run` and `npx tsc --noEmit`. At the end run `npm run build` and fix anything that breaks. Then start the dev server and compare each page with its reference screenshot at 1360 px and 390 px (use Playwright to take screenshots), and fix the differences.
- Do not push. I push from my computer.
- When finished, update `CLAUDE.md` (a short "Design" section pointing to `design/`) and tell me what differs from the references and why.
