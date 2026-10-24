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

## New Jersey (added)
| Sanyam | Claude |
|---|---|
| Glance at the live page: the "New or used" dropdown is new | Zero emission vehicle fee for a new EV (four years up front, rising each July) is held out until the schedule is printed |
| | Zero emission fee for used EVs ($270) is calculated from "$250 + $10 a year", marked "check source"; re-check each July |
| | Title assumes no lien ($85 with one, $110 with two); add a lien input if wanted |

## Tennessee (on hold)
| Sanyam | Claude |
|---|---|
| Save https://www.tn.gov/content/dam/tn/revenue/documents/countyclerks/Codefeesched.pdf as `tmp/tn-fees.pdf` (fetch failed from Claude's side) | Title fee and registration fee: need the county clerk fee schedule |
| Download the current local sales tax rates by county and city (Revenue site, "Local Sales Tax" page, rate tables) and save as `tmp/tn-local-rates.*` | Model: 7% state, local rate on the first $1,600, plus the 2.75% single article tax on $1,600 to $3,200 (the last can use the new priceAtLeast condition) |
| | Electric fee $200 now ($274 from 2027) and hybrid $100 at renewal are on the DOR notice |

## Maryland (on hold)
| Sanyam | Claude |
|---|---|
| The MVA site shows Claude a Cloudflare block page. In your browser, open https://mva.maryland.gov/title-registration/fees-payment-options/excise-tax and https://mva.maryland.gov/title-registration/fees-payment-options, expand every section, then print each to PDF as `tmp/md-excise.pdf` and `tmp/md-fees.pdf` | Read the excise tax rate, trade-in rule, title fee and registration by weight, then add the state |

## Added since the last list
Indiana, Massachusetts, New Jersey, Virginia, Washington, Arizona. Indiana and Massachusetts: yearly excise taxes are not included (Indiana depends on value and county, Massachusetts is billed by your city or town).

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
- Use the New or used input for Ohio and other states where it matters (input now exists)
- Plug-in hybrid and hybrid fuel options
- Minimum-tax support (Virginia $75 minimum)
- Playwright interactive tests
- Michigan registration (needs list price and age)
- California county registration fees
