# Sumdock to-do (updated 2026-10-24)

Two columns per state: what only Sanyam can do (blocked sites, accounts, pushing) and what Claude does once that is in.

## Arizona (added, partly modeled)
| Sanyam | Claude |
|---|---|
| Spot-check one city with a price tier (for example Avondale, 5,000 dollar tier) on the ADOR rate look-up tool or with a dealer, and tell Claude if the tax on a 30,000 dollar car differs from the calculator | City tax is now modeled (96 cities, 33 with a lower rate above a set price). Table wording says only "Single Item Over" for some cities; treated as the part above the price. Confirm from an ADOR source, then mark the local rate verified |
| | Vehicle license tax is not included (needs list price and age inputs) |

## Idaho (researched, not added)
| Sanyam | Claude |
|---|---|
| Ask ITD (or check their page again) what the middle age band really is: the page prints "3 or 6 years" and has no row for 0, 4 or 5 years (your saved PDF shows the same) | Official ITD page: registration $69 for 1 or 2 years old, $57 for the middle band, $45 for 7 or more, EV +$140, plug-in hybrid +$75; title $14 plus county admin fees for 44 counties |
| | Blocked: the age bands and a finer vehicle age input in the calculator |

## North Dakota (researched, not added)
| Sanyam | Claude |
|---|---|
| Download https://www.dot.nd.gov/sites/www/files/documents/MVD%20-%202%20Passenger%20Fee%202023.pdf (my tools get an error on it) and save it in tmp/. The registration-manual.pdf you added does not contain the fee table | Verified so far: 5% excise tax on purchase price less trade-in, credit if the other state allows a reciprocal credit (tax.nd.gov); title $5, abandoned vehicle disposal fee $1.50, electric $120 and plug-in hybrid $50 road use fees (DOT manual, Rev. 07/25) |
| | Blocked: the passenger registration fee depends on weight and the year first registered. The 2023 schedule may also have changed under a 2025 bill, so check it is current |

## South Dakota (researched, not added)
| Sanyam | Claude |
|---|---|
| Find an official SD DOR page that says whether a trade-in lowers the 4% excise tax base (the cars-trucks-vans page does not say) | Have: 4% excise tax on purchase price, $10 title fee, and the staggered non-commercial license fee table (non-commercial-vehicle-license-fee.pdf in tmp/): by weight and vehicle age, per month of registration |
| | Blocked: trade-in rule, and the calculator needs a vehicle age input finer than new, recent and older to use the 0 to 9 versus 10+ year bands |

## Rhode Island, New Mexico, Maine (researched, not added)
| Sanyam | Claude |
|---|---|
| Find the Rhode Island passenger registration fee by weight (your saved page says only "based on vehicle weight" and lists no amounts; try the RI DMV registration fee schedule or the statute table) | Rhode Island: 7% sales tax on purchase price minus trade-in for dealer sales (passenger vehicles only); new title $53.50 including the $3.50 technology surcharge; passenger registration adds $3.50 and a $20 DOT surcharge per year plus an EV fee. Blocked on the weight table and credit for tax paid elsewhere |
| Find the registration fee table by weight and model year at https://www.mvd.newmexico.gov/what-is-the-fee-for-registering-my-vehicle/ or a linked PDF | New Mexico: 4% excise tax on price minus trade-in, credit for tax paid elsewhere (tax.newmexico.gov, page modified Apr 2026). Registration is $27 to $62 a year by weight and model year, but no table found; title fee not found |
| Nothing yet | Maine: 5.5% sales tax and $33 title fee are on maine.gov/sos; the page does not say if a trade-in lowers the tax, registration amounts are on a separate page, and the yearly excise tax is billed by your town |

## Mississippi, Iowa, Utah, Oklahoma (looked at, not added)
| Sanyam | Claude |
|---|---|
| Nothing yet | Mississippi: title $9 (dor.ms.gov/motor-vehicle-titles); sales tax rate, trade-in rule and tag fees not found on the DOR pages I could read |
| | Utah: registration uses an age-based uniform fee that needs a finer vehicle age input than the calculator has (tax.utah.gov Pub 23, dmv.utah.gov/?p=3212) |
| | Oklahoma and Iowa: only third-party pages found so far; need official OTC and Iowa DOT pages |

## Louisiana, Wyoming, Delaware, Hawaii (looked at, not added)
| Sanyam | Claude |
|---|---|
| Nothing yet | Louisiana: LDR Pub R-20164 (6/20) says 4.45% state tax plus local tax by the buyer's home (1.85 to 7 percent) and a rate-to-rate credit for tax paid elsewhere, but does not explain trade-ins and is from 2020; need a current LDR or OMV page (dam.ldr.la.gov/taxforms/20164-6-20.pdf) |
| | Wyoming: Teton County page lists 7% on net purchase price including documentary fees and a $30 state registration fee; the county fee uses factory cost times a depreciation factor times 3%, which needs a list price and age input (tetoncountywy.gov/444/Vehicle-Registration-Fees) |
| | Delaware and Hawaii: search returned only third-party pages; need the official DMV and tax pages |

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
Tennessee, South Carolina, Kansas, Nebraska, Vermont, West Virginia, Connecticut, Alabama, Wisconsin, Indiana, Massachusetts, New Jersey, Virginia, Washington, Arizona. Indiana and Massachusetts: yearly excise taxes are not included (Indiana depends on value and county, Massachusetts is billed by your city or town).

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
