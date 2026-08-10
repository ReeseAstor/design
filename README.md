# Reese Astor — conversion site

A mobile-first conversion site for USA Today bestselling romance author Reese Astor. The primary
product is **Golden Parachute**, Hudson Dynasty Book 3.

The site optimises one thing:

```
estimated attributable author revenue
────────────────────────────────────
      qualified landing sessions
```

Not page views, and not newsletter signups. The newsletter is a recovery path for readers who are
not buying today; it never stands between a reader and the Buy button.

---

## Table of contents

- [Quick start](#quick-start)
- [How content resolves (and why it runs with no credentials)](#how-content-resolves)
- [Current launch state: what is missing and why](#current-launch-state)
- [Routes](#routes)
- [The tracked Amazon redirect](#the-tracked-amazon-redirect)
- [Funnel state](#funnel-state)
- [The experiment](#the-experiment)
- [Analytics contract](#analytics-contract)
- [Sanity setup and seeding](#sanity-setup-and-seeding)
- [Importing cover assets](#importing-cover-assets)
- [Kit setup](#kit-setup)
- [PostHog setup](#posthog-setup)
- [Amazon Attribution setup](#amazon-attribution-setup)
- [Going live with Golden Parachute](#going-live-with-golden-parachute)
- [Testing](#testing)
- [Deploying to Vercel](#deploying-to-vercel)
- [Performance notes](#performance-notes)
- [Repository map](#repository-map)

---

## Quick start

```bash
npm install
cp .env.example .env.local     # every value may stay empty for local work
npm run dev                    # http://localhost:3000
```

With an empty `.env.local` the site boots into **seed-content mode**: pages render from
`data/catalog.seed.json` plus the approved Golden Parachute copy in
`lib/content/golden-parachute.ts`, analytics is a no-op, and the newsletter endpoint validates
without contacting Kit. Nothing is stubbed with fake data — the seed *is* the supplied catalog.

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit`, strict mode |
| `npm test` | Vitest unit suite |
| `npm run test:e2e` | Playwright suite (builds and starts the app itself) |
| `npm run seed:catalog` | Write the catalog into Sanity |
| `npm run import:covers` | Upload cover art into Sanity |

---

## How content resolves

Every page asks `lib/content/source.ts` for content. It resolves in one of two ways and normalises
both into the same types:

```
NEXT_PUBLIC_SANITY_PROJECT_ID set?
├── yes → Sanity (GROQ, cached, tag "content")
│          └── on error → seed content, with the failure logged
└── no  → seed content (data/catalog.seed.json + lib/content/golden-parachute.ts)
```

This is why the whole Playwright suite runs on a fresh clone with no accounts. The acceptance
criteria have to hold *before* any credential exists, or they are not really guarantees.

One consequence worth knowing: in seed-content mode, production builds render the CSS-only cover
placeholder for **every** title, because production is not permitted to serve cover art from
`m.media-amazon.com`. Real covers appear once `npm run import:covers` has uploaded them to Sanity.
In development, Amazon source URLs render directly so you can see the layout with real art.

---

## Current launch state

Golden Parachute is **prelaunch**. The supplied catalog gives it a price ($4.99) and Kindle
Unlimited status, and nothing else:

| Missing | Consequence |
| --- | --- |
| ASIN | No product URL can be derived |
| Amazon product URL | `/go/golden-parachute/amazon` returns 404, never a placeholder redirect |
| Amazon Attribution URLs | The four paid campaigns cannot publish a purchase CTA |
| Approved cover | The CSS-only placeholder renders instead |

None of these is invented anywhere in this repository. The publication guard
(`lib/publication/guard.ts`) checks all of them on every render, and when one fails the page shows
its **prelaunch state**: no Buy button, an honest "not on sale yet" panel, and the two offers that
*are* real — Book 0 at $0.99 and the bonus scene. A clear configuration error is logged server-side
on each render:

```
[publication-guard] GP_ORGANIC → golden-parachute — cover_missing: No approved Sanity cover asset …
[publication-guard] GP_ORGANIC → golden-parachute — destination_missing: No valid Amazon destination …
```

See [Going live with Golden Parachute](#going-live-with-golden-parachute) for the checklist.

---

## Routes

**Public pages**

| Route | Campaign | Indexable |
| --- | --- | --- |
| `/golden-parachute` | `GP_ORGANIC` | yes |
| `/gp/meta-forced-proximity` | `GP_META_FORCEDPROX` | no, canonical → `/golden-parachute` |
| `/gp/tiktok-kai` | `GP_TIKTOK_KAI` | no, canonical → `/golden-parachute` |
| `/gp/bookbub-billionaire` | `GP_BOOKBUB_BILLIONAIRE` | no, canonical → `/golden-parachute` |
| `/gp/newsletter` | `GP_NEWSLETTER_EXISTING` | no, canonical → `/golden-parachute` |
| `/hudson-dynasty` | — | yes |
| `/books`, `/books/[slug]` | — | yes |
| `/`, `/about`, `/privacy`, `/cookies`, `/contact` | — | yes |

Paid pages render **no navigation above the first CTA** — a wordmark, not a nav. Every link in a
header is an exit from a funnel the campaign already paid for.

**Endpoints**

| Endpoint | Purpose |
| --- | --- |
| `GET /go/[book]/amazon` | The only path to Amazon |
| `POST /api/newsletter` | Kit V4 subscribe + tag |
| `POST /api/revalidate` | Sanity webhook, secret required |
| `GET /studio/[[...tool]]` | Embedded Sanity Studio |

**Migration redirects** (308, in `next.config.ts`): `/index.html → /`, `/books.html → /books`,
`/about.html → /about`, `/contact.html → /contact`, plus `/privacy.html`, `/cookies.html`,
`/golden-parachute.html` and `/series/hudson-dynasty`.

`sitemap.xml` lists organic and series pages only. `/gp/*`, `/go/*`, `/api/*` and `/studio/*` are
excluded by construction and disallowed in `robots.txt`.

---

## The tracked Amazon redirect

No visual component ever contains an amazon.com URL. Every purchase CTA is a `<BuyButton>` pointing
at an internal route:

```
/go/golden-parachute/amazon?c=GP_META_FORCEDPROX&placement=hero&variant=control&format=ebook
```

`app/go/[book]/amazon/route.ts` then, in order:

1. validates the book slug against a kebab-case pattern
2. validates the campaign ID against the registry
3. validates the CTA placement — `hero`, `sticky_mobile`, `mid_blurb`, `series_entry`, `footer`
4. validates the format — `ebook`, `audiobook`, `paperback`
5. validates the experiment variant
6. loads the campaign and book from content
7. resolves the variant-specific Amazon Attribution URL
8. checks the destination against a strict Amazon host allowlist
9. captures `amazon_click` **server-side**
10. sets the returning-reader cookie
11. returns a `307`

Two properties are worth stating plainly:

- **There is no `?url=` parameter, and adding one would require rewriting the route.** The
  destination is looked up from content; the query string only selects *which* record to look up.
  Extra query parameters are ignored, and there is a test that proves it.
- **The allowlist is a second, independent check.** Even an editor with Studio access cannot turn
  the route into an open redirect by pasting an arbitrary URL into a campaign document — the
  Studio validates it on save, and the route validates it again on use.

Paid traffic never falls back to a bare product URL. Without attribution the spend cannot be
measured against revenue, which is the entire point of the KPI.

**Cookie set on redirect**

```
ra_amazon_click = <book-slug>:<unix-timestamp>
Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000
```

A readable mirror, `ra_returning=1`, lets client components elevate the bonus-scene offer without a
second round trip. Neither cookie means "purchased" — a click is intent, and nothing on the site
ever thanks a reader for a purchase it cannot see.

---

## Funnel state

```
visit → Golden Parachute offer
      → unobtrusive Book 0 alternative for a new reader
      → Amazon click: record amazon_click, set returning cookie, 307 to Amazon
      → on return: purchase CTA stays; bonus scene + reader list are elevated
      → no click but high engagement: reveal the inline recovery offer
```

High engagement is defined exactly once, in `lib/posthog/engagement.ts`:

```ts
const highEngagement =
  !amazonClicked &&
  (scrollDepth >= 0.60 || activeTimeSeconds >= 45);
```

Active time counts only while the tab is visible — a phone face-down on a table is not an engaged
reader. When the threshold is crossed the module is revealed **inline**, once per session, below
the final CTA. It is never a modal and never covers the Buy button.

---

## The experiment

One experiment runs at launch: `gp_hero_value_proposition`.

| Arm | Label | Supporting line |
| --- | --- | --- |
| `control` | Read Golden Parachute — $4.99 | Also available with Kindle Unlimited |
| `ku_first` | Read with Kindle Unlimited | Or buy the Kindle edition for $4.99 |

Nothing else changes between arms — not the headline, not the cover, not the trope order. The
assignment is made **server-side** from the first-party `ra_aid` cookie, so the CTA is correct in
the first rendered byte and never swaps label after paint. That same ID is PostHog's distinct ID,
so what PostHog attributes matches what was rendered.

The variant propagates: exposure event → CTA rendering → `/go/` query → variant-specific attribution
URL.

**The rule for reading the result: a variant that produces more Amazon clicks but lower attributable
revenue loses.** Kindle Unlimited page reads and a $4.99 sale are not the same revenue event.

---

## Analytics contract

Seven explicit events. Autocapture, automatic pageviews and session recording are all off.

`landing_view` · `amazon_click` · `book0_click` · `newsletter_view` · `newsletter_subscribed` ·
`review_click` · `experiment_exposure`

Common properties: `campaign_id`, `book_id`, `traffic_source`, `utm_source`, `utm_medium`,
`utm_campaign`, `utm_content`, `landing_variant`, `experiment_key`, `experiment_variant`,
`cta_location`, `book_format`, `device_type`.

**Never captured**: email, first name, whole form payloads, Amazon customer identity, purchase
status, anything health related. This is enforced in code, not by convention:
`sanitizeEventProperties` runs on every capture path (browser and server) and strips forbidden keys,
email-shaped strings under any key, and nested objects — the last of which is how a whole form
payload usually leaks. Both the unit suite and the Playwright suite assert that no captured event
ever contains an email address.

`amazon_click` is captured server-side in the redirect handler. That click is the KPI's numerator,
and a server-side record survives ad blockers, a closing tab and a slow mobile network.

---

## Sanity setup and seeding

1. Create a project at [sanity.io/manage](https://sanity.io/manage) and note the project ID.
2. Create an **Editor** token (this is `SANITY_API_WRITE_TOKEN`) and, if your dataset is private, a
   **Viewer** token (`SANITY_API_READ_TOKEN`).
3. Fill in `.env.local`:

   ```bash
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_WRITE_TOKEN=sk...
   SANITY_REVALIDATE_SECRET=$(openssl rand -hex 32)
   ```

4. Add `http://localhost:3000` and `https://reeseastor.com` to the project's CORS origins.
5. Seed:

   ```bash
   npm run seed:catalog -- --dry-run   # inspect the transaction
   npm run seed:catalog
   ```

The seed writes 9 books, 5 campaigns and 5 landing pages using deterministic document IDs, so it is
safe to re-run. Books and landing pages are replaced; **campaigns are only created, never replaced**,
so a re-run cannot wipe attribution links someone entered by hand.

No social proof is seeded, and no attribution URL is seeded. Both would have to be invented.

**Webhook** — in Sanity, add a webhook to `https://reeseastor.com/api/revalidate` with header
`x-revalidate-secret: <SANITY_REVALIDATE_SECRET>`. Without the secret configured the endpoint
returns 503 rather than defaulting open.

---

## Importing cover assets

The Amazon `SL1500` URLs in the seed are **import sources, not production dependencies**.

```bash
npm run import:covers -- --dry-run   # fetch, validate, upload nothing
npm run import:covers
```

For each of the 24 supplied live cover records the script fetches the image, checks the HTTP status
and MIME type, reads the intrinsic width and height straight from the file header, rejects anything
under 300px or drifting more than 2% from the recorded dimensions, uploads it to Sanity, and patches
the matching format entry — preserving `cover_source_url`, `source_width` and `source_height` as
provenance.

Golden Parachute has no cover source and is skipped by design. Do not substitute another title's
art.

> **Note on verification.** The import logic — target collection, header parsing, dimension
> validation — is covered by `tests/unit/cover-import.test.ts`. The live fetch of all 24 records
> could not be executed in the build sandbox, whose network policy blocks `m.media-amazon.com`
> (`CONNECT tunnel failed, response 403`). Run the dry run once from a machine with ordinary
> internet access to confirm all 24 before seeding production.

---

## Kit setup

1. Create a V4 API key in Kit under **Settings → Advanced → API**.
2. Create these tags and copy their numeric IDs into `.env.local`:

   | Tag | Variable |
   | --- | --- |
   | `hudson_dynasty` | `KIT_TAG_HUDSON_DYNASTY_ID` |
   | `golden_parachute` | `KIT_TAG_GOLDEN_PARACHUTE_ID` |
   | `bonus_morning_after` | `KIT_TAG_BONUS_MORNING_AFTER_ID` |
   | `source_meta` | `KIT_TAG_SOURCE_META_ID` |
   | `source_tiktok` | `KIT_TAG_SOURCE_TIKTOK_ID` |
   | `source_bookbub` | `KIT_TAG_SOURCE_BOOKBUB_ID` |
   | `existing_reader` | `KIT_TAG_EXISTING_READER_ID` |

3. Create these custom fields: `source_campaign`, `source_channel`, `book_interest`, `bonus_offer`,
   `first_touch_url`.

Without `KIT_API_KEY` the endpoint runs in mock mode: the reader sees the same accessible success
state and the operator sees a clear log line. It never silently drops a real subscriber once the key
*is* set.

Server behaviour: validate → reject unless `consent === true` → screen the honeypot → create or
update the subscriber → apply tags → capture a PII-free event. Tag application is best-effort; a
subscriber missing a `source_meta` tag is a reporting gap, while a subscriber lost to a mistyped tag
ID is a lost reader. The email address goes to Kit and nowhere else — never to PostHog, never into a
log line, never into a response body.

---

## PostHog setup

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_...   # optional, for management APIs
```

Then create an experiment with key `gp_hero_value_proposition` and variants `control` and
`ku_first`. Assignment happens in this application (see above); PostHog receives the exposure event
with `$feature_flag` and `$feature_flag_response` set, which is what its experiment reporting keys
off.

Without a key, capture is a no-op that still validates the property bag — so a PII regression fails
in CI whether or not anyone has a PostHog account.

---

## Amazon Attribution setup

1. Enrol at [advertising.amazon.com](https://advertising.amazon.com/solutions/products/amazon-attribution)
   — KDP authors qualify through the
   [KDP programme](https://advertising.amazon.com/resources/whats-new/amazon-attribution-kdp-authors).
2. Create one campaign per traffic source, and **one tag per experiment variant**:

   | Campaign ID | Publisher | Tags needed |
   | --- | --- | --- |
   | `GP_META_FORCEDPROX` | Meta | `control`, `ku_first` |
   | `GP_TIKTOK_KAI` | TikTok | `control`, `ku_first` |
   | `GP_BOOKBUB_BILLIONAIRE` | BookBub | `control`, `ku_first` |
   | `GP_NEWSLETTER_EXISTING` | Email | `control`, `ku_first` |

3. Paste each attribution URL into the matching campaign document in the Studio, under
   **Amazon Attribution links**, with its marketplace, variant and format.

The Studio validates every URL against the same host allowlist the redirect uses, so a wrong paste
is caught on save rather than at click time.

Until a campaign has a link for the format *and* variant being served, its purchase CTA will not
publish. That is the intended behaviour, not a bug to route around.

---

## Going live with Golden Parachute

When KDP publishes the title, in the Studio:

- [ ] Book → Golden Parachute → ebook format → set the real **ASIN**
- [ ] Set the real **Amazon product URL**
- [ ] Confirm **price** ($4.99) and **Kindle Unlimited** status
- [ ] Upload the approved **cover** to the ebook format's `cover_asset`
      (or add its source URL to the seed and run `npm run import:covers`)
- [ ] Set `publication_status` to `live`
- [ ] For each paid campaign, add the variant-specific **Amazon Attribution URLs**
- [ ] Confirm each campaign is **active**

The purchase CTA appears automatically once the guard passes. Verify with:

```bash
curl -sI "https://reeseastor.com/go/golden-parachute/amazon?c=GP_ORGANIC&placement=hero&variant=control&format=ebook"
```

A `307` with an `amazon.com` `Location` means it is live. A `404` means something on the list above
is still missing — the server log names which.

---

## Testing

```bash
npm test                     # 77 unit tests
npm run test:e2e             # 234 Playwright tests across three viewports
```

Playwright builds and starts the app itself, with empty credentials, at 320px, 390px and 1280px.
If your environment ships a pinned Chromium, point at it:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-*/chrome-linux/chrome npm run test:e2e
```

**Unit** — campaign validation, the Amazon host allowlist, redirect lookup, variant propagation, the
engagement threshold, the publication guard, newsletter payload validation, the PII guard, the
cover-import pipeline, and the integrity of the supplied catalog (24 live cover records; no
audiobook or paperback marked as Kindle Unlimited; Golden Parachute carrying no ASIN, URL or cover).

**End to end** — the acceptance checklist, including: usable at 320px with no horizontal overflow;
paid pages with no competing navigation above the CTA; the sticky bar never covering content and
respecting the safe-area inset; every Buy button routing through `/go/`; an invalid campaign unable
to produce an external redirect; the redirect setting returning-reader state; Book 0 resolving to
exactly `https://www.amazon.com/dp/B0D82GWFD9`; events carrying campaign, placement and variant;
no event containing an email; Kit submission requiring consent; the returning visitor seeing the
bonus offer; the high-engagement non-clicker seeing the inline recovery offer; campaign pages
noindex and the organic page indexable; no layout shift while covers load; keyboard navigation and
focus states; and reduced-motion honoured.

---

## Deploying to Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Add the environment variables from `.env.example` for **Production** and **Preview**. Server
   secrets (`SANITY_API_*`, `KIT_*`, `POSTHOG_PERSONAL_API_KEY`) must not be given `NEXT_PUBLIC_`
   names.
3. Set `NEXT_PUBLIC_SITE_URL=https://reeseastor.com` in Production.
4. Add the domain and point DNS at Vercel.
5. Speed Insights is already wired in `app/layout.tsx`; enable it in the project's **Speed Insights**
   tab.
6. Point the Sanity webhook at `https://reeseastor.com/api/revalidate`.

---

## Performance notes

Targets: LCP ≤ 2.0s on a strong mobile connection, CLS ≤ 0.1, INP in the good range, Buy CTA usable
immediately.

How they are held:

- The first viewport is server-rendered, including the CTA label — the experiment is resolved on the
  server, so nothing swaps after paint.
- Only the active hero cover is `priority`; catalog grids stay lazy. No catalog preloading.
- Cover boxes carry their aspect ratio, so the layout is final before any image byte arrives. There
  is a CLS assertion in the Playwright suite.
- Client JavaScript is limited to the Buy button, the newsletter form, the engagement tracker and
  the sticky bar. Everything else is a server component.
- No autoplay media, no hero carousel, no third-party widget above the fold.
- Fonts are loaded through `next/font` with metric-adjusted fallbacks, so the swap does not shift
  the page.

The conversion pages are dynamic rather than static, because they read the `ra_aid` and
`ra_amazon_click` cookies to resolve the variant and the returning-reader state. That is a
deliberate trade: a static page would have to resolve both on the client, which is exactly the
flicker the targets above rule out.

---

## Repository map

```
app/
  golden-parachute/       organic conversion page
  gp/[campaignSlug]/      paid campaign pages
  hudson-dynasty/         series read-through
  books/, books/[slug]/   catalog
  go/[book]/amazon/       tracked redirect
  api/newsletter/         Kit V4
  api/revalidate/         Sanity webhook
  studio/[[...tool]]/     embedded Studio
components/
  conversion/             ConversionPage and its sections
  analytics/              PostHog provider, engagement tracker
  legal/, site/           legal shell, header, footer
lib/
  amazon/                 host allowlist, destination resolution
  campaigns/              campaign registry
  content/                types, Sanity/seed source, Golden Parachute copy
  conversion/             view model, server-side page preparation
  cookies/                cookie contract
  experiments/            definitions and assignment
  kit/, posthog/          integrations
  publication/            the publication guard
  seo/                    JSON-LD
  validation/             redirect and newsletter schemas
sanity/schemaTypes/       book, campaign, landingPage, socialProof
scripts/                  seed-catalog, import-cover-assets
tests/                    unit/, e2e/, fixtures/
data/catalog.seed.json    the supplied catalog, unmodified
```

---

© Reese Astor. Published by 88Away LLC. Amazon, Kindle, Kindle Unlimited and Audible are trademarks
of Amazon.com, Inc. or its affiliates. This project is not endorsed by or affiliated with Amazon.
