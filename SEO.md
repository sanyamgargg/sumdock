# SEO and AEO (search and answer engines)

Builders live in `lib/seo.ts` (pure, tested in `lib/seo.test.ts`). `/llms.txt` is served by `app/llms.txt/route.ts`.
Every number in titles, descriptions and structured data comes from `calculate()` and the data files.

## Wiring (do after the redesign is merged)

1. `app/vehicle/[state]/page.tsx`: in `generateMetadata`, return `stateMetadata(s)` (replaces the hand-built title,
   description, canonical and robots). The title already gets ` | Sumdock` from the layout template.
2. Same page: render `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(statePageLd(s)).replace(/</g, "\\u003c") }} />`
   once, inside the page.
3. Same page: show `answerSentence(s)` (may be null) as the first paragraph under the h1, as plain text in the HTML.
   Answer engines quote the first clear sentence on the page.
4. `app/page.tsx`: add the same script tag with `siteLd()`.
5. `app/layout.tsx` metadata: add `openGraph` via `openGraph("/", title, description)` and `twitter: { card: "summary" }`.
6. Other pages (about, methodology, changelog, contact, privacy, vehicle index): each needs a unique title and description, a canonical, and OG tags.
7. Run `npx vitest run`, `npm run build`, then view source on a state page and paste its URL into Google's Rich Results Test.

## Your tasks (outside the repo)

- **Cloudflare robots.txt.** Cloudflare's managed robots.txt currently disallows GPTBot, ClaudeBot, Claude-User, ChatGPT-User,
  Perplexity-User, Google-Extended, Applebot-Extended and CCBot. Search engines are fine, but AI assistants cannot cite you.
  In Cloudflare: Security > Settings > Bot traffic (or AI Crawl Control) > turn off "Manage your robots.txt" / "Block AI bots",
  or allow the user-triggered agents (ChatGPT-User, Claude-User, Perplexity-User, OAI-SearchBot, PerplexityBot, Claude-SearchBot)
  while keeping training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended) blocked. Then re-check https://sumdock.com/robots.txt.
- Google Search Console: add the domain, submit `https://sumdock.com/sitemap.xml`, request indexing for the home page and live states.
- Bing Webmaster Tools: import from Search Console (also feeds ChatGPT search and Copilot).
- After deploy, confirm `https://sumdock.com/llms.txt` returns text.
