# Sumdock to-do (updated 2026-10-24)

Two columns per state: what only Sanyam can do (blocked sites, accounts, pushing) and what Claude does once that is in.

## Arizona (added, partly modeled)
| Sanyam | Claude |
|---|---|
| Spot-check one city with a price tier (for example Avondale, 5,000 dollar tier) on the ADOR rate look-up tool or with a dealer, and tell Claude if the tax on a 30,000 dollar car differs from the calculator | City tax is now modeled (96 cities, 33 with a lower rate above a set price). Table wording says only "Single Item Over" for some cities; treated as the part above the price. Confirm from an ADOR source, then mark the local rate verified |
| | Vehicle license tax is not included (needs list price and age inputs) |

## Remaining states (status after the overnight run on 2026-10-24)
Added in that run: Arkansas, Nevada, Mississippi, Delaware, Alaska, Maine, Montana, South Dakota, Idaho, North Dakota, Rhode Island. A new "Vehicle age (years)" input now exists for fees that change by age band (Montana, South Dakota, Idaho, North Dakota use it).

| State | What is missing | Who |
|---|---|---|
| New Mexico | Registration is $27 to $62 for 1 year by weight and model year (mvd.newmexico.gov, no table). Need the table, the title fee and the 4% excise tax pages with trade-in rule | Sanyam: find the MVD fee table or the Vehicle Procedures Manual |
| Wyoming | The 4% state tax and county rates, trade-in rule and the $30 state fee need official pages; the county registration fee needs list price and age | Sanyam: save the Wyoming DOR vehicle tax page and WYDOT fee page |
| Hawaii | GET is 4% plus the 0.5% county surcharge (tax.hawaii.gov county surcharge page), but no page on vehicle sales or trade-ins. Honolulu fees (csd page): state $46, county $20, beautification $10, emblem $0.50, state and county weight taxes by pound (rates not printed) | Sanyam: find the DOTAX page on motor vehicle sales and the weight tax per pound |
| New Hampshire | No sales tax. The state fee changed on Jan 1 2026 (HB 2) and the municipal permit fee uses list price, so only third-party and town pages were found | Sanyam: save the NH DMV fee page and the 2026 fee update |
| Delaware | Added from the Delaware Code and the Sept 2025 fee announcement; dmv.de.gov blocks automated reading, so the DMV fee page was not used. Check the registration $40 and EV fee on the DMV site | Sanyam: spot-check dmv.de.gov fees |
| Michigan | In review: registration depends on list price and age | Claude: use the new age input once list price handling is decided |

## Vehicle states, Nov 11 2026
Added: Oklahoma, Louisiana, Missouri (new taxable horsepower input), Utah, Kentucky, Colorado, Maryland, Iowa, Minnesota (new "price below" fee condition). The old "on hold" notes below for Maryland, Missouri, Colorado and Kentucky are done.

Still missing, and what would unblock each:
| State | Blocker | Who |
|---|---|---|
| Illinois | ilsos.gov blocks visitors from India (Access Denied) and ilga.gov's statute text shows an old $95 title fee. Rate, trade-in and local rules are confirmed from IDOR (ST-556, ST-9) | Sanyam: from a US connection or VPN, save ilsos.gov/departments/vehicles/basicfees.html as a PDF |
| Wyoming | County registration fee is a share of the factory list price by age; rate charts are Google Drive files | Sanyam: save the WYDOT registration fee page and the latest master rate chart as PDFs; Claude: decide how to handle list price |
| Hawaii | No DOTAX page on vehicle sales or trade-ins; weight tax rates per pound not printed | Sanyam: find the Honolulu weight tax rates and the DOTAX general excise page on vehicle sales |
| New Hampshire | No sales tax; state and town fees depend on list price and changed Jan 1 2026 | Sanyam: save the NH DMV fee page |
| New Mexico | Registration table by weight and model year not published as text | Sanyam: find the MVD fee table |
| Michigan | Registration depends on list price and age | Claude: decide list price handling (same question as Wyoming and New Hampshire) |

Known approximations in the new states (all marked check source on the page):
- Colorado first-year ownership tax, Iowa registration value part, Minnesota first-year registration tax and EV surcharge use the price entered in place of the sticker price or DOT value.
- Utah $44 registration is the Code amount; it is adjusted for inflation each year.
- Oklahoma registration by year of registration is mapped to vehicle age.
- Kentucky $21 registration is from a county clerk page.
- Louisiana plate rows above $41,499 follow the stated rate; the OMV table stops there.

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

## Tennessee (added, county amounts not included)
| Sanyam | Claude |
|---|---|
| Nothing | Local tax rate is entered by the user (applies to the first $1,600 only). Could add a county rate table from the Dept. of Revenue rate list, plus county wheel tax and clerk fees, if you can open https://www.tn.gov/revenue (the state's local rate list) |

## Maryland (on hold)
| Sanyam | Claude |
|---|---|
| The MVA site shows Claude a Cloudflare block page. In your browser, open https://mva.maryland.gov/title-registration/fees-payment-options/excise-tax and https://mva.maryland.gov/title-registration/fees-payment-options, expand every section, then print each to PDF as `tmp/md-excise.pdf` and `tmp/md-fees.pdf` | Read the excise tax rate, trade-in rule, title fee and registration by weight, then add the state |

## Missouri (on hold)
| Sanyam | Claude |
|---|---|
| Download the motor vehicle sales tax rate chart https://dor.mo.gov/forms/MV%20-%20Local%20Sales%20Tax.pdf as `tmp/mo-local-rates.pdf` (56 pages, updated 8/25/2026, valid for Oct to Dec 2026) | Build the city and county picker from it (rows for Missouri dealers vs non-Missouri dealers need a decision) |
| Save the Motor Vehicle Fees page with the horsepower fee chart on dor.mo.gov as `tmp/mo-fees.pdf` (print the page to PDF) | Confirmed so far: 4.225% state rate, trade-in reduces the price, title $8.50, title processing $9, registration processing $9 per year; registration fee by horsepower needs a horsepower input or is left out |

## Colorado (on hold)
| Sanyam | Claude |
|---|---|
| Open https://dmv.colorado.gov/taxes-and-fees, expand every section (Title Fees, Specific Ownership Tax, FASTER Fees, Electric & Hybrid, etc.), print to PDF as `tmp/co-fees.pdf` | The page text arrives without its tables; local tax depends on city, county and special districts, and the specific ownership tax depends on value and age |
| Download the state's sales and use tax rate publication (DR 1002) as `tmp/co-rates.pdf` | Confirmed: trade-in reduces the price, credit for tax paid to another state exists |

## Kentucky (on hold)
| Sanyam | Claude |
|---|---|
| Find the Kentucky Revenue or Transportation Cabinet page that states how a trade-in affects the 6% usage tax and save it as `tmp/ky-usage-tax.pdf` | Only county clerk pages give the title ($9) and registration ($21) fees; a state agency page for both is needed before publishing |

## Minnesota
Registration tax is based on the vehicle's value, so it would be left out; not started.

## Added since the last list
Arkansas, Nevada, Mississippi, Delaware, Alaska, Maine, Montana, South Dakota, Idaho, North Dakota, Rhode Island, Tennessee, South Carolina, Kansas, Nebraska, Vermont, West Virginia, Connecticut, Alabama, Wisconsin, Indiana, Massachusetts, New Jersey, Virginia, Washington, Arizona. Indiana and Massachusetts: yearly excise taxes are not included (Indiana depends on value and county, Massachusetts is billed by your city or town).

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
- Each January: shift the vehicle-age bands in North Dakota (the schedule is by year first registered; bands are set for 2026) and re-check Utah-style age tables if added
- Trade-in rule that depends on new or used (Kentucky), so the calculator can use the New or used input for the trade-in
- Registration fee by list price (New Hampshire, Michigan, Iowa, Wyoming, Louisiana): needs a list-price input or a different treatment

## Partly verified: what would resolve it
Counts after the overnight run are in the data files (status per item). Most remaining "partial" items fall in these groups:
- "No local sales tax" claims (TX, NC, MI, VT, WV, VA, MA, CT, IN, ME, MS, ID, SD, ND, DE and others): the official pages describe a single rate and never mention local tax. They stay partial until an official page says there is none
- Rules found only on legal-text sites (Nebraska trade-in and credit, Idaho credit, Arkansas trade-in): need the agency's own page
- Fees found only on a county page (Kansas, Montana title, Montana MHP fee): need the state fee page
- Old documents (South Dakota fee chart from 2015, Alaska 2024 chart, Nevada county rates dated 2020): need a current copy
- Rules that depend on band edges the page does not define (Idaho age bands, ND year-first-registered bands)
- Kansas state rate and Washington out-of-state credit were upgraded to verified in the overnight run

