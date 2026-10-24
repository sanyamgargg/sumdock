# Sumdock to-do (updated 2026-10-24)

Two columns per state: what only Sanyam can do (blocked sites, accounts, pushing) and what Claude does once that is in.

## Arizona (added, partly modeled)
| Sanyam | Claude |
|---|---|
| Nothing | City privilege tax is not included: cities charge a lower rate on the part of a single item above a set amount, which needs tiered local rates in the calculator (types and picker) |
| | Vehicle license tax is not included (needs list price and age inputs) |

## Washington (added)
| Sanyam | Claude |
|---|---|
| Check one address on dor.wa.gov/TaxRateLookup against the calculator and tell Claude if it differs | Confirm which location (delivery or registration address) sets the local rate; today the local rate is marked "check source" |
| | Electric vehicle fees ($100 or $50, plus $75) held out until the DOL page says which applies |
| | Regional transit excise tax and weight-based gross weight fee are not included |

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
