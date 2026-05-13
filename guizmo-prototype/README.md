# Guizmo Designs / Charlotte Vehicle Wraps — AI Wrap Studio (Prototype v3)

A bold, Wrapmate-style 6-step intake flow that turns a customer's vehicle, industry, and brand into four AI-generated wrap concepts in under a minute. Built for Guizmo Designs (also operating as Charlotte Vehicle Wraps) in Charlotte, NC.

**For non-developer setup, see [SETUP.md](./SETUP.md).**

---

## What's new in v3

v3 is a complete UX refactor of v2. The AI engine (Gemini 2.5 Flash Image + sharp logo composite + GPT-4o-mini design brief) is unchanged — but the flow around it is now a 6-step wizard that mirrors the Wrapmate intake experience and dials the local-Charlotte voice up to 11.

### What v3 brings

- **6-step wizard** (down from a single intake form): Vehicle → Industry → Style → Brand → Contact → Designs.
- **NHTSA vPIC API integration** for cascading Year → Make → Model dropdowns covering 2010–2027.
- **Industry-first prompt system** (`lib/industryPrompts.ts`) — 12 industries each contribute motifs, palette descriptors, and an energy line that get injected into the Gemini prompt. This is the single biggest quality lever in the app.
- **Logo URL fetcher** — paste a website URL and we'll scan og:image → apple-touch-icon → favicon → header img tags and pull the first usable logo, normalized to a clean PNG via sharp. Falls back to manual upload.
- **Lead notification on Step 5** — the moment the customer submits Contact, we email `info@charlottevehiclewraps.com` with the full intake (before generation starts). They never wait on AI to capture the lead.
- **4 concept variations in parallel** — front-heavy, side-panel-focus, full-coverage, and accent-heavy compositions, each rendered through Gemini with the customer's logo as a reference and the original logo composited on top.
- **Per-concept tweak loop** — "what would you change?" free-text → regenerates that concept with the tweak applied to the prompt.
- **Pricing tiers** (Decals & Lettering / Partial Wrap / Full Wrap) with "Start with this" → quote-request email.
- **"Talk to a real human" bar** — tap-to-call `704.323.7608`, email `info@charlottevehiclewraps.com`, schedule-a-call placeholder for Calendly later.
- **Bold local voice throughout** — "Pick your weapon", "What energy are you going for?", "Pick a fight", "Charlotte's bold vehicle wrap studio".

### What was reused from v2

| Piece | Status |
|---|---|
| `lib/processLogo.ts` (sharp + @resvg/resvg-js logo normalization + compositing) | **Reused as-is** |
| Gemini 2.5 Flash Image integration (`@google/genai`) | **Reused**, prompt builder rewritten in `app/api/generate-concept` |
| OpenAI design-brief generation (`gpt-4o-mini`, JSON mode) | **Reused**, prompt extended with industry/vibe + bold voice |
| Resend email integration | **Reused**, split into `/api/notify-lead` (lead capture) + `/api/send-quote` (post-design quote) |
| `.env.example` structure | **Reused**, renamed `QUOTE_*` → `LEAD_*` for clarity, no new vars |
| Tailwind setup, fonts | **Reused**, theme tweaked — palette leans heavier on orange/electric accents vs v2's navy luxe |

### Removed / replaced from v2

- The coverage-check step from the original 7-step plan was dropped — coverage is now a 3-card selector inside Step 4 (Brand).
- v2's monolithic `IntakeForm.tsx` was split into 6 step components in `components/steps/`.
- The legacy DALL·E fallback route (`/api/generate-mockup`) is gone.
- v2's `BriefCard` UI is gone — the brief now drives the prompt invisibly.
- v2's `jsPDF` export was removed — replaced with per-concept share links + "I want this one" quote flow.

---

## Quick start (developers)

```bash
cp .env.example .env.local        # add GEMINI_API_KEY and OPENAI_API_KEY
npm install
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

No new env vars compared to v2. Anything already configured on Vercel keeps working.

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | YES | Gemini 2.5 Flash Image concept generation. Get one at <https://aistudio.google.com/app/apikey>. |
| `OPENAI_API_KEY` | YES | GPT-4o-mini design brief. |
| `RESEND_API_KEY` | optional | Lead-notification + quote emails. Without it, payloads are logged to the server console. |
| `LEAD_TO_EMAIL` | optional | Destination email. Defaults to `info@charlottevehiclewraps.com`. |
| `LEAD_FROM_EMAIL` | optional | From address. Defaults to Resend's `onboarding@resend.dev`. |

If you previously had `QUOTE_TO_EMAIL` / `QUOTE_FROM_EMAIL` set in Vercel, they will still work — the code reads `LEAD_TO_EMAIL || 'info@charlottevehiclewraps.com'`, so you can either rename them or leave the defaults alone.

## The 6 steps

1. **Vehicle** — Year (hardcoded 2010–2027) → Make (NHTSA vPIC `GetMakesForVehicleType` for car/truck/mpv, deduped) → Model (NHTSA `GetModelsForMakeYear`) → Trim (free text, optional). An SVG silhouette updates as the user picks.
2. **Industry** — 12 quick-select cards (Construction, Plumbing, HVAC, Electrical, Landscaping, Roofing, Cleaning Services, Mobile Services, Delivery/Logistics, Food Trucks, Real Estate, Other). Other reveals a free-text field. This is **the** lever — see `lib/industryPrompts.ts`.
3. **Style/Vibe** — 4 cards: Bold & Loud / Clean & Professional / Rugged & Industrial / Playful & Friendly.
4. **Brand** — Logo (upload tab OR pull-from-website tab) + Business Name / Tagline / Website / Phone toggles + color pickers (with "Surprise me" toggle + 🎲 randomize) + 3-card coverage selector.
5. **Contact** — Name, email, phone (pre-filled from Step 4 if entered). Trust signal copy. The submit button:
   - **Fires `/api/notify-lead` immediately** (Guizmo gets the lead even if the user closes the tab during generation).
   - **Then** calls `/api/design-brief` once and `/api/generate-concept` four times in parallel.
6. **Designs** — Four concepts in a responsive grid, each with 👍/👎 / Tweak / Share / "I Want This" actions. Pricing tiers below. Talk-to-a-Human bar below that.

## API routes

| Route | Method | Purpose | Engine |
|---|---|---|---|
| `/api/vehicles/makes` | GET | Combined, deduped makes from NHTSA `car`/`truck`/`mpv` types + a small fallback list. | NHTSA vPIC (cached 24h in-process) |
| `/api/vehicles/models?make=X&year=Y` | GET | Models for a make+year. | NHTSA vPIC |
| `/api/fetch-logo` | POST | Pull a usable logo from a website URL (og:image → apple-touch-icon → favicon → header img with `logo` in src). Returns a normalized PNG as a data URL. | sharp + native fetch |
| `/api/design-brief` | POST | Intake → structured JSON brief in Guizmo's voice. | `gpt-4o-mini` (JSON mode) |
| `/api/generate-concept` | POST (multipart) | Generate ONE concept variation. Client calls 4× in parallel with different `variation` tags. Accepts an optional `tweak` field for regeneration. | `gemini-2.5-flash-image` + sharp logo composite |
| `/api/notify-lead` | POST | Lead capture email (fired before generation). | Resend (or log fallback) |
| `/api/send-quote` | POST | Quote-request email with chosen concept attached. | Resend (or log fallback) |

## File map

```
app/
  layout.tsx                              Root layout + fonts (Archivo + Inter)
  page.tsx                                6-step wizard orchestrator
  globals.css                             v3 theme (orange-forward)
  api/
    vehicles/
      makes/route.ts                      NHTSA proxy — makes
      models/route.ts                     NHTSA proxy — models
    fetch-logo/route.ts                   Logo URL fetcher (og:image → favicon → img)
    design-brief/route.ts                 OpenAI design brief
    generate-concept/route.ts             Gemini concept generation (called 4×)
    notify-lead/route.ts                  Lead capture email
    send-quote/route.ts                   Quote request email
components/
  GuizmoLogo.tsx                          Custom SVG mark
  ProgressBar.tsx                         Step indicator (clickable back)
  TalkToHumanBar.tsx                      Persistent local-shop CTA
  LoadingScreen.tsx                       Wrapmate-style 5-step animated loader
  PricingTiers.tsx                        3 pricing cards
  steps/
    Step1Vehicle.tsx                      Y/M/M dropdowns + silhouette
    Step2Industry.tsx                     12 industry cards
    Step3Style.tsx                        4 vibe cards
    Step4Brand.tsx                        Logo upload+URL tabs, toggles, colors, coverage
    Step5Contact.tsx                      Lead gate
    Step6Designs.tsx                      Concept grid, tweak modal, share, quote
lib/
  industryPrompts.ts                      THE prompt system — extend here
  processLogo.ts                          Reused from v2 — sharp + resvg + composite
  types.ts                                Shared TS types
  vehicleSilhouette.ts                    SVG silhouette classifier (truck/van/suv/sedan)
```

## How to tune the design output

Every prompt knob lives in one of two places:

- **`lib/industryPrompts.ts`** — edit motifs, palette descriptors, and `promptFragment` per industry. This is the file you'll edit 80% of the time.
- **`app/api/generate-concept/route.ts`** → `buildPrompt()` — edit COLORS firmness, COVERAGE rules, the variation `VARIATION_DETAILS` table, and the DON'Ts block.

## Deployment notes (Vercel)

The existing Vercel project has:
- Root Directory set to `guizmo-prototype` (this folder is named the same — drop-in compatible).
- `OPENAI_API_KEY` and `GEMINI_API_KEY` already set.
- Framework Preset = Next.js.

Optional housekeeping in Vercel **Settings → Environment Variables**:
- Rename `QUOTE_TO_EMAIL` → `LEAD_TO_EMAIL` (or leave both, the code reads `LEAD_TO_EMAIL` first and falls through to the hardcoded `info@charlottevehiclewraps.com` default).

Push the v3 folder contents to `github.com/guizmodesigns-create/guizmo-prototype` — Vercel auto-deploys.

## Cost estimates per generation

| Item | Cost |
|---|---|
| Design brief (gpt-4o-mini, ~1k tokens) | ≈ $0.01 |
| 4× Gemini 2.5 Flash Image concepts | ≈ $0.16 |
| Logo compositing (sharp, local) | $0.00 |
| **Total per customer** | **≈ $0.17** |

Tweak regenerations add ≈ $0.04 each.

## Rate limiting

Still not implemented. Before public exposure:
- Add per-IP throttle (Vercel Edge Middleware or Upstash Rate Limit).
- Cap generations per session.
- Consider adding a captcha on Step 5 (Contact).
