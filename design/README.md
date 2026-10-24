# Sumdock design reference ("Statement" direction)

Static visual references for the redesign. They are **not production code**: rebuild them as React components in the Next.js app. Open any `.html` file in a browser to see it, or look at the matching `.png`.

| File | What it shows |
|---|---|
| `reference/state-page-desktop.html` | A state page at desktop width (Texas example) |
| `reference/state-page-phone.html` | The same page at 390 px wide |
| `reference/home.html` | Home page |
| `reference/state-index.html` | The `/vehicle/` list of states |

The sample numbers (Texas, Travis County, $30,000 vehicle, total $1,976.00) come from the real data files. In the app, every number must come from `lib/calc.ts` and `data/states/*.json`, never be typed into a component.

## Design idea

An itemized statement. The result is a receipt: ruled lines, dotted leaders, monospace amounts, numbered footnotes that point to a sources table. It should read as official and exact, not as a startup landing page.

## Tokens

| Token | Value | Use |
|---|---|---|
| ground | `#F4F4F1` | page background |
| surface | `#FFFFFF` | form and statement panels |
| ink | `#111111` | text, borders, primary buttons |
| ink-muted | `#3C4149` body, `#4A4F57` secondary | all gray text (both pass 4.5:1 on ground and surface) |
| hairline | `#E3E3DE` row dividers, `#D9D9D4` list dividers, `#C9C9C3` column dividers | |
| accent | `#B8320F` | footnote numbers, the logo mark, active nav underline, "partly verified" glyph, section numbers |
| warn-bg / warn-ink | `#FBF1EC` / `#8A2508` and body `#3A2A24` | "Not included" box |
| Text font | IBM Plex Sans 400/500/600/700 | load with `next/font/google` |
| Number font | IBM Plex Mono 400/500/600 | amounts, labels in caps, footnotes, dates |
| Radius | 0 everywhere | panels, inputs, buttons are square |
| Borders | 1px solid ink on panels and inputs | |
| Page width | max 1200 px, 32 px side padding (16 px on phone) | |

Type scale: h1 44 px / 30 px phone, weight 700, letter-spacing -0.025em. Section h2 22 px. Body 16 px. Total amount 48 px mono 600 (40 px phone). Small caps labels: Plex Mono 12 to 13 px, uppercase, letter-spacing 0.06em.

## Components to build

- **SiteHeader / SiteFooter**: wordmark `sumdock` in Plex Mono 600 with the square logo mark (outline square with three short lines, the first line in accent). Nav: Vehicle costs, Methodology, Changelog, About. Active item has a 2 px accent underline. On phone the nav collapses into a 44 px square menu button.
- **PurchaseForm**: black header strip ("Your purchase" left, state name right, mono caps), then fields. Inputs are 46 px tall, 1 px ink border, no radius, mono numerals. Fuel is a two-segment control (selected = ink fill, white text). Checkbox uses `accent-color: #111`.
- **StatementPanel**: header row (mono caps: "Estimate / Travis County, Texas" and "Reviewed Oct 24, 2026"), then one row per result line: label, superscript footnote `[n]` in accent that links to the source row, dotted leader (`border-bottom: 1px dotted #8C9096`), amount in mono. Then a 3 px double rule, "Total taxes and fees" and the big total, then a sentence with price plus fees. At the bottom the "Not included" box lists everything in `result.excluded` with its reason.
- **SourcesTable**: heading "Sources" with a count and the review date, then rows `[n]`, what the page supports, publisher, "Open page". Footnote numbers are assigned in the order lines appear in the statement; lines that share a source share a number. Rows scroll horizontally inside a box on narrow screens; on phone use the stacked version in `state-page-phone.html`.
- **StatusMark**: a small square glyph plus a word. Verified = solid ink square. Partly verified = square with a 2 px accent border and white fill. In review = square with a dashed gray border. Never rely on color alone: the word is always shown.
- **StateIndexRow** (state-index page): one row per state: name (18 px 600), main tax description, status mark, review date, arrow. In-review states are not links and are shown in gray. Keep the status legend under the list.
- **Home**: hero with a sample statement card on the right (render it from the real Texas calculation at build time, do not hardcode), the calculators list (one live card), and the three "How we keep the numbers honest" columns separated by hairlines.
- **FAQ**: native `<details>` rows between ink rules, no card chrome.

## Behavior and accessibility

- Keep all existing logic: `lib/calc.ts`, the `Inputs` shape, county pickers (including the New York single picker), `localRates`, source and status handling, changelog data, ad slots and indexing rules. This is a visual rebuild.
- Real `<label>`, `<button>`, `<a>`; visible focus ring (2 px accent outline, 2 px offset); touch targets at least 44 px; text contrast at least 4.5:1.
- The statement panel keeps `aria-live="polite"`.
- No emoji. Icons only as inline SVG with `aria-hidden` when decorative.
- Phone: inputs stack in one column, the statement rows wrap (label left, amount right), no horizontal page scroll.
