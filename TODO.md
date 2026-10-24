# Sumdock to-do (updated 2026-10-24)

Two columns per state: what only Sanyam can do (blocked sites, accounts, pushing) and what Claude does once that is in.

## Arizona (added, partly modeled)
| Sanyam | Claude |
|---|---|
| Spot-check one city with a price tier (for example Avondale, 5,000 dollar tier) on the ADOR rate look-up tool or with a dealer, and tell Claude if the tax on a 30,000 dollar car differs from the calculator | City tax is now modeled (96 cities, 33 with a lower rate above a set price). Table wording says only "Single Item Over" for some cities; treated as the part above the price. Confirm from an ADOR source, then mark the local rate verified |
| | Vehicle license tax is not included (needs list price and age inputs) |

## South Carolina (researched, not added)
| Sanyam | Claude |
|---|---|
| Links: https://dor.sc.gov/resources-site/lawandpolicy/Documents/sales-and-use-tax-auto-and-truck-dealers-guide.pdf and https://dmv.sc.gov/Fees . Ask SCDOR or SCDMV whether a trade-in lowers the IMF base | Official facts found: infrastructure maintenance fee (IMF) of 5% of gross proceeds, at most $500, in place of state and local sales tax (SCDOR dealers guide, Dec 2025); title $15; registration $40 every two years; hybrid +$60, EV +$120 (dmv.sc.gov/Fees) |
| | Blocked: no official page says whether a trade-in lowers the IMF base, so the state cannot be published. Needs a "maximum tax" field in the calculator too |

## Idaho (researched, not added)
| Sanyam | Claude |
|---|---|
| Links: https://itd.idaho.gov/dmv/vehicle-registration/ and https://itd.idaho.gov/dmv/vehicle-titles/ . Check the age bands in the fee table with an ITD office or the page itself | Official ITD page: registration by vehicle age ($69 for 1 or 2 years, $57 for the 3 to 6 band, $45 for 7 or more, EV +$140, plug-in hybrid +$75) plus county registration and title admin fees for 44 counties; title $14 |
| | Blocked: the page prints the middle band as "3 or 6 years" and has no row for 0, 4 or 5 years, so the fee cannot be modeled safely. Needs a finer age input and a county fee table |

## North Dakota (researched, not added)
| Sanyam | Claude |
|---|---|
| If you can open it, download https://www.dot.nd.gov/sites/default/files/documents/Motor%20Vehicle%20Services/registration-manual.pdf and save it in tmp/ (my tools cannot read the fee table in it) | Verified so far (tax.nd.gov): 5% excise tax on purchase price less trade-in; credit for excise tax paid elsewhere if the other state allows a reciprocal credit |
| | From the DOT manual: title $5; electric vehicle road use fee $120, plug-in hybrid $50 on top of registration |
| | Blocked: the passenger registration fee depends on weight and the year first registered, and the table is in the part of the PDF I cannot read |

## South Dakota (researched, not added)
| Sanyam | Claude |
|---|---|
| Links: https://dor.sd.gov/individuals/motor-vehicle/cars-trucks-vans/ (open the non-commercial license fees PDF linked there and save it in tmp/) | 4% excise tax on purchase price and a $10 title fee are on dor.sd.gov, but the page does not say whether a trade-in lowers the price, and registration amounts are in a separate PDF |

## Rhode Island, New Mexico, Maine (researched, not added)
| Sanyam | Claude |
|---|---|
| Open https://dmv.ri.gov/registrations-plates-titles/registration/registration-fees in your browser (it shows a bot check to me) and send me the passenger "New" and "Renewal" rows | Rhode Island: 7% sales tax on purchase price minus trade-in for dealer sales (passenger vehicles only); title $52.50 (dmv.ri.gov, no date on pages). Blocked on registration amounts and the credit for tax paid elsewhere |
| Find the registration fee table by weight and model year at https://www.mvd.newmexico.gov/what-is-the-fee-for-registering-my-vehicle/ or a linked PDF | New Mexico: 4% excise tax on price minus trade-in, credit for tax paid elsewhere (tax.newmexico.gov, page modified Apr 2026). Registration is $27 to $62 a year by weight and model year, but no table found; title fee not found |
| Nothing yet | Maine: 5.5% sales tax and $33 title fee are on maine.gov/sos; the page does not say if a trade-in lowers the tax, registration amounts are on a separate page, and the yearly excise tax is billed by your town |

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
Nebraska, Vermont, West Virginia, Connecticut, Alabama, Wisconsin, Indiana, Massachusetts, New Jersey, Virginia, Washington, Arizona. Indiana and Massachusetts: yearly excise taxes are not included (Indiana depends on value and county, Massachusetts is billed by your city or town).

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
