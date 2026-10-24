# Plan summary

Full plan lives in the shared doc: https://claude.ai/artifact/FEDbF3KgmtrKoMhkE2wUoS

## Goal
Side income from a US vehicle tax and fee calculator site, monetized with Google AdSense. Realistic target: about $100-$300/month after 6-12 months. Ongoing upkeep is required.

## Stack
Next.js static export, one JSON file per state, pure TypeScript calculator with tests, free static host (Cloudflare Pages, Netlify or Vercel). Python only for data-collection helpers.

## Accuracy rules
- Official source link plus date opened for every field.
- One official worked example per state as a test where available.
- Cross-check against aggregators (Tax Foundation, ARTBA EV table, NCSL) but never cite them as the only source.
- Monthly changed-page check, full re-verification each January and July.
- Public changelog per state page. "Estimate, not tax advice" disclaimers.

## AdSense readiness
Named author, About, Contact, Privacy, Methodology pages. Pre-rendered pages. Original explanatory content per state, not just a calculator. Do not apply until 30+ useful pages exist.

## Phases
1. Pilot: TX, CA, FL, NY, OR (in progress, see PILOT-STATUS.md)
2. All states
3. Trust pages and EV fees
4. Launch and index
5. AdSense application
6. Expand (private-party rules, county fees, lease, motorcycles)

## Open decisions
- Will Sanyam put his name and background on the site (strongly helps AdSense approval)?
- Which five states go first (default TX, CA, FL, NY, OR)?
- Domain name.
