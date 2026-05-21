# Setup (non-developer guide) — Guizmo v3

This is the plain-English version. If you can copy/paste and click buttons, you can deploy v3.

---

## What you're deploying

A 6-step web app that turns a customer's vehicle + industry + brand into four AI-generated wrap concepts plus a quote request. Replaces the v2 single-form flow.

## What's the same as v2

- Same Vercel project, same GitHub repo, same root-directory name (`guizmo-prototype`).
- Same env vars (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`) — **no new keys to set up**.
- Same Gemini + OpenAI engine under the hood.

## What's different

- The customer goes through **six** steps instead of one big form.
- We get **a lead email the instant they submit Step 5** (Contact) — before the AI even finishes generating. So even if they bail mid-render, you have their info.
- Each customer now gets **four** concept variations instead of one.
- Customers can **tweak** any concept ("make the logo bigger", "swap to a darker blue") and get a fresh re-render of just that concept.
- We can pull a logo straight from their website URL — no more "I don't have a logo file" dead-end.
- The whole thing now sounds like Guizmo: "Pick your weapon", "Pick a fight", "Charlotte's bold vehicle wrap studio".

---

## Step-by-step deployment (existing Vercel project)

1. **Confirm your env vars in Vercel are still set.**
   - Open <https://vercel.com> → your team → the `guizmo-prototype` project → **Settings → Environment Variables**.
   - Confirm these exist for **Production**, **Preview**, and **Development**:
     - `OPENAI_API_KEY`
     - `GEMINI_API_KEY`
     - `RESEND_API_KEY` (optional — without it, lead emails log to the server console)
   - **No new env vars are needed for v3.**
   - Optional cleanup: `QUOTE_TO_EMAIL` and `QUOTE_FROM_EMAIL` from v2 can be renamed to `LEAD_TO_EMAIL` and `LEAD_FROM_EMAIL` for clarity, but the defaults (`info@charlottevehiclewraps.com` / `onboarding@resend.dev`) will work without them.

2. **Get the v3 code into your repo.**
   - Download the `guizmo-prototype-v3.zip` file.
   - Unzip it. The folder inside is `guizmo-prototype-v3` — when you put it on GitHub, **rename it to `guizmo-prototype`** so it matches the Vercel Root Directory setting.
   - Replace the contents of `github.com/guizmodesigns-create/guizmo-prototype` with the new files. Easiest way: upload via the GitHub web UI, drag the unzipped contents in, commit "Deploy v3".

3. **Watch Vercel auto-deploy.**
   - Within ~2 minutes, your `https://your-site.vercel.app` will rebuild and serve v3.
   - If you set up a custom domain in v1/v2, it carries over automatically.

4. **Smoke-test it.**
   - Open the site in a new tab.
   - Step 1: Pick `2024 Ford F-150` (or whatever).
   - Step 2: Pick `HVAC`.
   - Step 3: Pick `Bold & Loud`.
   - Step 4: Try the **Pull from website** tab with a known site that has a logo (e.g. `nike.com`). Toggle "Surprise me" on for colors. Coverage = Full wrap.
   - Step 5: Use a real test email (yours). Click Generate.
   - You should immediately get a "New lead" email at `info@charlottevehiclewraps.com` (if `RESEND_API_KEY` is set).
   - ~45 seconds later, four HVAC concepts appear with proper snowflakes + thermometer + cool blue / warm orange split.

---

## Where things are if you want to tweak them

### Industry prompts (the secret sauce)

`lib/industryPrompts.ts`. Each industry has:

- `motifs` — list of visual elements the AI should consider (e.g. for HVAC: snowflake, thermometer, sun)
- `paletteDescriptor` — what color palette fits when "Surprise me" is on
- `energy` — a one-liner describing the energy of the wrap
- `promptFragment` — the exact sentence(s) injected into the Gemini prompt

Edit these to tune what comes back from the AI for each industry. This is the single highest-leverage file in the app.

### Pricing tiers

`components/PricingTiers.tsx`. Three constants you can edit:

```
Decals & Lettering — Starting at $1,200 — as low as $55/mo
Partial Wrap       — Starting at $3,800 — as low as $175/mo (most popular)
Full Wrap          — Starting at $7,500 — as low as $345/mo
```

### The phone number and email

Hardcoded as:
- Phone: `704.323.7608` (`tel:+17043237608`)
- Email: `info@charlottevehiclewraps.com`

Look in `components/TalkToHumanBar.tsx` and `app/page.tsx` (header + footer) and `app/api/notify-lead/route.ts` if you ever change these.

### Calendly placeholder

The "Schedule a call" button in `components/TalkToHumanBar.tsx` is currently disabled with a "Coming soon" tooltip. When you set up Calendly, replace the disabled `<button>` with an `<a href="https://calendly.com/your-link" target="_blank">`.

---

## If something looks broken

- **Lead emails aren't arriving.** Check `RESEND_API_KEY` is set in Vercel and that the `LEAD_FROM_EMAIL` address is verified in your Resend dashboard. (If using `onboarding@resend.dev`, it works without verification but ends up in spam often.) Also check the Vercel function logs — `/api/notify-lead` always logs the payload to the console even if email fails.
- **Concepts are blank or "couldn't generate".** Check `GEMINI_API_KEY` in Vercel and that the key has access to `gemini-2.5-flash-image`. Vercel function logs for `/api/generate-concept` will tell you exactly what failed.
- **Vehicle dropdowns are empty.** NHTSA's API is occasionally slow on cold-start (3–5 seconds for the first request). Refresh once. The list is cached for 24 hours after that.
- **Logo URL fetch returns "no logo found".** Some sites block automated fetches or don't expose a clean `og:image`. The customer just falls back to uploading a file — no big deal.
