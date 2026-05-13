import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { Intake, DesignBrief } from '@/lib/types';
import { INDUSTRY_PROMPTS, VIBE_DESCRIPTORS } from '@/lib/industryPrompts';

// =========================================================================
// /api/design-brief  (v3)
// Takes the full v3 intake and returns a structured DesignBrief.
// =========================================================================
// COST NOTE: ~$0.01 per call with gpt-4o-mini.
// =========================================================================

export const runtime = 'nodejs';

function buildSystemPrompt(): string {
  return `You are a senior vehicle wrap designer at Guizmo Designs (also operating as Charlotte Vehicle Wraps), an award-winning wrap shop in Charlotte, NC.
Your job: take a customer's intake and produce a concise, bold, industry-aware design brief for their vehicle wrap.
Voice: bold and confident, never corporate. Direct, energetic, slightly swaggering — like a Charlotte shop that knows it's the best.
You always respond with valid JSON matching the requested schema. Color hex codes must be 6-digit (e.g. "#1A2B3C").
Keep recommendations practical for a real wrap install.`;
}

function buildUserPrompt(intake: Intake): string {
  const industry = INDUSTRY_PROMPTS[intake.industry] ?? INDUSTRY_PROMPTS.other;
  const industryLabel =
    intake.industry === 'other' && intake.industryOther
      ? `Other — ${intake.industryOther}`
      : industry.label;

  const vibe = VIBE_DESCRIPTORS[intake.vibe];

  const colorBlock = intake.colors.surpriseMe
    ? `Color preference: SURPRISE ME — pick a palette that fits the industry. Suggested industry palette descriptor: ${industry.paletteDescriptor}`
    : `Color preference: primary ${intake.colors.primary}, secondary ${intake.colors.secondary}. Use these as your base; adjust only if there is a clear branding reason.`;

  const veh = intake.vehicle;
  const vehicleLine = `${veh.year} ${veh.make} ${veh.model}${veh.trim ? ' ' + veh.trim : ''}`;

  const brandLines: string[] = [];
  if (intake.brand.showBusinessName && intake.brand.businessName)
    brandLines.push(`Business name: "${intake.brand.businessName}"`);
  if (intake.brand.showTagline && intake.brand.tagline)
    brandLines.push(`Tagline: "${intake.brand.tagline}"`);
  if (intake.brand.showWebsite && intake.brand.website)
    brandLines.push(`Website: ${intake.brand.website}`);
  if (intake.brand.showPhone && intake.brand.phone)
    brandLines.push(`Phone: ${intake.brand.phone}`);

  return `Customer intake:
- Vehicle: ${vehicleLine}
- Industry: ${industryLabel}
- Industry energy direction: ${industry.energy}
- Industry motifs to consider: ${industry.motifs.join(', ')}
- Vibe: ${vibe.label} — ${vibe.description}
- Coverage: ${intake.coverage}
- Logo provided: ${intake.logo.source !== 'none' ? 'Yes (will be supplied to the renderer as a reference)' : 'No'}
- ${colorBlock}
- Brand text to feature:
  ${brandLines.length ? brandLines.map((l) => '  - ' + l).join('\n') : '  - (no extra text — let the logo / wordmark do the work)'}

Produce a design brief as JSON with this exact shape:
{
  "palette": {
    "name": "short evocative name e.g. 'Carolina Power Strike'",
    "colors": [
      { "name": "Primary",   "hex": "#RRGGBB", "usage": "where it appears on the vehicle" },
      { "name": "Secondary", "hex": "#RRGGBB", "usage": "..." },
      { "name": "Accent",    "hex": "#RRGGBB", "usage": "..." }
    ]
  },
  "layout": "1-2 sentences describing layout/composition (front-heavy / side-panel-focused / full-coverage / accent-heavy mix is fine)",
  "typography": "1 sentence describing type direction",
  "keyElements": ["4-6 short bullet items — iconography, graphic devices, drawn from the industry motifs"],
  "rationale": "2-3 sentences in Guizmo's bold confident voice explaining why this brief crushes for THIS business on THIS vehicle."
}`;
}

export async function POST(req: Request) {
  try {
    const intake = (await req.json()) as Intake;

    if (!intake?.industry || !intake?.vehicle?.make) {
      return NextResponse.json(
        { error: 'Missing required intake fields (industry, vehicle).' },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OPENAI_API_KEY is not set. Copy .env.example to .env.local and add your key.',
        },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(intake) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from OpenAI.' },
        { status: 502 },
      );
    }

    const brief = JSON.parse(content) as DesignBrief;

    if (
      !brief.palette ||
      !Array.isArray(brief.palette.colors) ||
      !brief.layout ||
      !brief.rationale
    ) {
      return NextResponse.json(
        { error: 'Malformed brief from model.', raw: brief },
        { status: 502 },
      );
    }

    return NextResponse.json({ brief });
  } catch (err: any) {
    console.error('[design-brief] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error.' },
      { status: 500 },
    );
  }
}
