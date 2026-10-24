# Pilot status (2026-10-24)

| State | Publishable | What is solid | What is missing |
|---|---|---|---|
| Oregon | Yes | No sales tax (DOR), 0.5% vehicle use tax on out-of-state-dealer new vehicles (DOR OR-591-C), title and registration by MPG/EV (ODOT, effective 07/01/26), plates | County registration fees, OReGO option, 4-year registration, rental |
| Florida | Yes, with caveats | 6% state rate (DOR), $225 initial registration fee (FLHSMV procedure dated 2022) | Title and registration come from a county tax collector page; trade-in and the $5,000 surtax cap come from a secondary page reproducing older DOR guidance; EV fee unverified; county surtax rates not loaded |
| Texas | No | 6.25% rate, trade-in rule, out-of-state credit (Comptroller), title fee $28/$33 (county page) | Base registration fee, EV fee, explicit "no local tax" statement; use TxDMV pages |
| California | No | 7.25% base and district range (CDTFA), VLF 0.65% (DMV) | Two DMV pages disagree on registration ($65 vs $76), CHP ($29 vs $34), road improvement fee ($102 vs $121) and transportation improvement tiers; trade-in rule from a general FAQ example; district rate lookup |
| New York | No | Out-of-state credit mechanism (DMV), 2010 advisory opinion on trade-in | State rate, local rates, title and registration fees: official pages did not return numbers in this environment |

## Why some states are blocked
The research tools could only open some official pages. TxDMV, FLHSMV fee pages, NY DMV fee estimator and tax.ny.gov vehicle pages were refused, so those values were left blank rather than filled from aggregators.

## Next actions
1. Open the blocked pages in a normal browser and fill the blanks (TX registration/EV, NY everything, FL title/registration/EV, CA conflicts).
2. Resolve each California conflict from a dated DMV notice or the DMV fee calculator.
3. Add official worked examples as tests where they exist.
4. Then expand to the remaining states.
