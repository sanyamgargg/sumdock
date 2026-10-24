# Sumdock to-do (updated 2026-10-24)

Two columns per state: what only Sanyam can do (blocked sites, accounts, pushing) and what Claude does once that is in.

## Arizona (on hold)
| Sanyam | Claude |
|---|---|
| Save https://azdor.gov/sites/default/files/document/TPT_RATETABLE_10012026.pdf as `tmp/az-tpt-rates.pdf` (azdor.gov blocks Claude's browser with a bot check) | Parse county and city retail rates into the local-rate picker |
| | Write `data/states/az.json`: state 5.6%, trade-in reduces the price, title $4, registration $8, air quality $1.50, use tax with credit for tax paid elsewhere (all confirmed), vehicle license tax listed as not included (needs original list price) |
| | Tests, changelog entry, content block |

## Washington
Confirmed so far: state rate 6.5% (DOR flyer), DOL fee page (basic fee $43.25, tab $30, filing and service fees, title $15, weight fee $10, EV fees, plates $50).
| Sanyam | Claude |
|---|---|
| Download the current quarter local-rate flyer for car dealers (Oct to Dec 2026, `MVETLSUFlyer`) from dor.wa.gov and save as `tmp/wa-local-rates.pdf`. About 400 rows; the fetch tool cannot align them reliably | Parse local rate by location, build the city and county picker |
| Open https://dor.wa.gov/TaxRateLookup once and tell Claude whether it works without a login (used to spot-check a few addresses) | Confirm from DOR that a trade-in lowers the taxable price |
| | Sound Transit motor vehicle excise tax depends on list price: list as not included, with a reason |
| | Resolve which EV fee applies ($100 vs $50, $75 electrification fee) before using them; hold them out until the DOL page is clear |

## New Jersey
Confirmed so far: 6.625% rate and trade-in reduces the price (MVC form GU-30, rev. 7/25), title $60 ($85 with a lien), registration by weight and age (table on nj.gov/mvc), zero-emission vehicle fee $250 from July 2024 plus $10 a year.
| Sanyam | Claude |
|---|---|
| Nothing blocking yet. If nj.gov returns an "Access Denied" page in your browser, tell Claude | Model registration: under or over 3,500 lbs, and "within 2 years" (needs a new-or-used input, see backlog) |
| | Compute the zero-emission vehicle fee for the current year and confirm it on nj.gov |
| | Check the luxury tax on vehicles over a price threshold on the NJ Division of Taxation site; add if confirmed |
| | Lien: title is $60 or $85 with a lien. Calculator has no lien input: decide whether to add one |

## Other states waiting
| Sanyam | Claude |
|---|---|
| Illinois: open ilsos.gov fee page (or use a US connection) and paste the vehicle title and registration fee text | Model IL once the fee text is here (DOR part is reachable) |
| Florida: download the FLHSMV registration fee chart PDF and save as `tmp/fl-fees.pdf` | Verify FL registration against the chart |
| | Texas and North Carolina: find a statement that there is no local vehicle sales tax |

## Site and SEO (all Sanyam)
- [ ] Push the latest commits (Virginia, SEO wiring, redesign) and let Cloudflare deploy
- [ ] Run `npm run build` on your machine to confirm it passes (fonts download works there)
- [ ] Cloudflare: change the managed robots.txt / AI bot block so AI assistants can cite the site (Security, Bot traffic or AI Crawl Control)
- [ ] Search Console: request indexing for home, `/vehicle/` and every state page; check the sitemap status again on 2026-10-26
- [ ] Bing Webmaster Tools: import from Search Console
- [ ] Run the GitHub Action "Monthly source check" once (Actions, Run workflow). If it cannot commit, set Settings, Actions, Workflow permissions to read and write
- [ ] Test that hello@sumdock.com receives mail
- [ ] Validate structured data on a state page at validator.schema.org (the Rich Results Test will not show FAQ markup)
- [ ] AdSense application when the site has been live for a few weeks and has more than five states

## Claude backlog (frontend / product)
- New or used toggle (needed for Ohio, New Jersey, Arizona)
- Plug-in hybrid and hybrid fuel options
- Minimum-tax support (Virginia $75 minimum)
- Playwright interactive tests
- Michigan registration (needs list price and age)
- California county registration fees
