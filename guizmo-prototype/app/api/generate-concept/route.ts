import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { Intake, DesignBrief, ConceptResult } from '@/lib/types';
import { processLogo, compositeLogoOnMockup } from '@/lib/processLogo';
import { INDUSTRY_PROMPTS, VIBE_DESCRIPTORS } from '@/lib/industryPrompts';

// =========================================================================
// /api/generate-concept  (v3)
// Generates ONE concept variation. The client calls this 4× in parallel
// with different `variation` tags to get four distinct concepts.
//
// REQUEST: multipart/form-data
//   intake    : JSON string (Intake)
//   brief     : JSON string (DesignBrief)
//   variation : "front-heavy" | "side-panel" | "full-coverage" | "accent-heavy"
//   tweak     : (optional) free-text user tweak for regeneration
//   logo      : (optional) original logo file (PNG/JPG/SVG)
//
// RESPONSE: { id, label, imageDataUrl, promptUsed, variation }
// =========================================================================

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL_NAME = 'gemini-2.5-flash-image';

type Variation = ConceptResult['variation'];

const VARIATION_DETAILS: Record<
  Variation,
  { label: string; emphasis: string; layoutHint: string }
> = {
  'front-heavy': {
    label: 'Front-Heavy',
    emphasis:
      'Emphasize the FRONT of the vehicle — bold hood graphics, dramatic front-fender treatment, large focal logo on the front-half of the side panel.',
    layoutHint:
      'Front-half focal weight. Hood and front quarter-panel carry the most visual energy.',
  },
  'side-panel': {
    label: 'Side-Panel Focus',
    emphasis:
      'Emphasize a single oversized side-panel composition — wordmark + logo + key element treated like one big billboard down the full length of the side.',
    layoutHint:
      'Single horizontal composition spanning the full side panel like a billboard.',
  },
  'full-coverage': {
    label: 'Full Coverage',
    emphasis:
      'Wrap the ENTIRE vehicle in graphics — hood, sides, rear, roof edge. Pattern + color fields + logo blocks edge-to-edge.',
    layoutHint:
      'Edge-to-edge graphic field. Pattern flows across panels without dead space.',
  },
  'accent-heavy': {
    label: 'Accent Mix',
    emphasis:
      'Lean into an accent-color burst — a single bold diagonal slash, color stripe, or geometric shape carrying the brand, with intentional negative space.',
    layoutHint:
      'Negative space + one bold accent shape. Less is more, but the accent is unmissable.',
  },
};

interface MockupArgs {
  intake: Intake;
  brief: DesignBrief;
  variation: Variation;
  tweak?: string;
  hasLogo: boolean;
}

function buildPrompt(args: MockupArgs): string {
  const { intake, brief, variation, tweak, hasLogo } = args;
  const veh = intake.vehicle;
  const vehicleLine = `${veh.year} ${veh.make} ${veh.model}${veh.trim ? ' ' + veh.trim : ''}`;

  const industry = INDUSTRY_PROMPTS[intake.industry] ?? INDUSTRY_PROMPTS.other;
  const industryLabel =
    intake.industry === 'other' && intake.industryOther
      ? `Other — ${intake.industryOther}`
      : industry.label;
  const vibe = VIBE_DESCRIPTORS[intake.vibe];
  const variationDetail = VARIATION_DETAILS[variation];

  // ---- COLORS ----
  const colorsBlock = intake.colors.surpriseMe
    ? `COLORS: Use a vibrant, saturated, high-contrast palette suited to the ${industryLabel} industry. ${industry.paletteDescriptor}. Do NOT default to grayscale, black-and-white, muted or washed-out palettes.`
    : `COLORS: The wrap MUST predominantly use these EXACT colors: primary ${intake.colors.primary}, secondary ${intake.colors.secondary}. Apply these as LARGE color fields on the body panels (not just thin accents). Do NOT default to grayscale or washed-out. The colors must be VIBRANT and clearly visible across the wrap.`;

  // ---- COVERAGE ----
  let coverageBlock = '';
  if (intake.coverage === 'full') {
    coverageBlock =
      'COVERAGE: This is a FULL VEHICLE WRAP. Graphics, patterns, and color MUST cover 100% of the visible body panels — hood, doors, side panels, rear, fenders, and roof edge. Do NOT leave large areas of unwrapped body color showing.';
  } else if (intake.coverage === 'partial') {
    coverageBlock =
      'COVERAGE: This is a PARTIAL WRAP. Graphics cover roughly 50–60% of the body, with intentional negative space remaining on the upper portion. Focus the colored wrap on the doors and lower body panels with a clean transition line.';
  } else {
    coverageBlock =
      'COVERAGE: This is a DECALS + LETTERING ONLY treatment. The vehicle remains its original body color. Apply only the business name in stylized vinyl lettering and the logo to the side panel and hood. Do NOT apply background color fields or full-panel graphics.';
  }

  // ---- LOGO ----
  const logoBlock = hasLogo
    ? `LOGO: The provided reference image IS the customer's actual logo. Place this logo prominently on the side panel of the vehicle. Preserve its exact colors, shape, and proportions as faithfully as possible. Do NOT redraw it, do NOT change its colors, do NOT add extra elements to it.`
    : intake.brand.businessName
    ? `LOGO: No logo file provided. Render the business name "${intake.brand.businessName}" as STYLIZED TYPOGRAPHY appropriate to the chosen vibe — treat the wordmark itself as the focal logo. Make the type bold and unmistakable.`
    : `LOGO: No logo or business name provided. Use a strong abstract focal mark based on the industry motifs as the centerpiece.`;

  // ---- TEXT ----
  const textLines: string[] = [];
  if (intake.brand.showBusinessName && intake.brand.businessName) {
    textLines.push(
      `Render the business name "${intake.brand.businessName}" prominently and LEGIBLY on the side panel. Spell it EXACTLY as written — letter-for-letter.`,
    );
  }
  if (intake.brand.showTagline && intake.brand.tagline) {
    textLines.push(
      `Include the tagline "${intake.brand.tagline}" in smaller secondary type beneath the business name.`,
    );
  }
  if (intake.brand.showPhone && intake.brand.phone) {
    textLines.push(
      `Include the phone number "${intake.brand.phone}" in a clearly readable smaller line.`,
    );
  }
  if (intake.brand.showWebsite && intake.brand.website) {
    textLines.push(
      `Include the website "${intake.brand.website}" in a clearly readable smaller line.`,
    );
  }
  const textBlock = textLines.length
    ? 'TEXT: ' + textLines.join(' ')
    : 'TEXT: No additional text required beyond the logo / wordmark.';

  // ---- STYLE / INDUSTRY / VARIATION ----
  const industryBlock = industry.promptFragment;
  const vibeBlock = `VIBE: ${vibe.label} — ${vibe.description}.`;
  const variationBlock = `LAYOUT VARIATION (${variationDetail.label}): ${variationDetail.emphasis} ${variationDetail.layoutHint}`;
  const briefBlock = `DESIGNER NOTES: Layout direction — ${brief.layout}. Typography direction — ${brief.typography}. Key design elements — ${brief.keyElements.join(', ')}.`;

  // ---- VEHICLE ----
  const vehicleBlock = `VEHICLE: Photorealistic side-profile view (slight 3/4 angle so the front fender and side panel are both visible) of a ${vehicleLine}. Maintain the silhouette and proportions correct to that exact year/make/model. Clean studio lighting, neutral light-gray seamless background, subtle ground shadow. Commercial product-shot quality. The vehicle fills most of the frame.`;

  // ---- DON'Ts ----
  const dontsBlock = `DO NOT: Do NOT garble or misspell text — every letter must be correct and crisp. Do NOT use a stock photo aesthetic. Do NOT show people, hands, or other vehicles. Do NOT add fake URLs, fake phone numbers, or generic placeholder text. Do NOT use a generic vinyl-wrap template. Do NOT output a lettering-only result when a full or partial wrap was requested. Do NOT use grayscale unless the customer's palette is explicitly grayscale.`;

  const tweakBlock = tweak
    ? `CUSTOMER TWEAK (apply this on top of everything above): ${tweak}`
    : '';

  return [
    `Generate a single high-quality vehicle wrap design mockup.`,
    vehicleBlock,
    colorsBlock,
    coverageBlock,
    logoBlock,
    textBlock,
    industryBlock,
    vibeBlock,
    variationBlock,
    briefBlock,
    tweakBlock,
    dontsBlock,
    `Output: one final photorealistic image of the wrapped vehicle.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const intakeRaw = form.get('intake');
    const briefRaw = form.get('brief');
    const variationRaw = form.get('variation');
    const tweakRaw = form.get('tweak');

    if (typeof intakeRaw !== 'string' || typeof briefRaw !== 'string') {
      return NextResponse.json(
        { error: '`intake` and `brief` are required JSON strings.' },
        { status: 400 },
      );
    }

    const intake = JSON.parse(intakeRaw) as Intake;
    const brief = JSON.parse(briefRaw) as DesignBrief;

    const variation = (
      typeof variationRaw === 'string' && variationRaw in VARIATION_DETAILS
        ? variationRaw
        : 'side-panel'
    ) as Variation;
    const tweak = typeof tweakRaw === 'string' ? tweakRaw : undefined;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set in the environment.' },
        { status: 500 },
      );
    }

    // ---- Process logo, if provided -------------------------------------
    let processedLogoPng: Buffer | null = null;
    const logoFile = form.get('logo');
    if (logoFile && typeof logoFile !== 'string') {
      const file = logoFile as File;
      if (file.size > 0) {
        const ab = await file.arrayBuffer();
        const inputBuf = Buffer.from(ab);
        const mime = file.type || guessMime(file.name);
        try {
          const processed = await processLogo(inputBuf, mime);
          processedLogoPng = processed.pngBuffer;
        } catch (err) {
          console.warn('[generate-concept] logo processing failed:', err);
        }
      }
    }

    // ---- Build prompt ---------------------------------------------------
    const prompt = buildPrompt({
      intake,
      brief,
      variation,
      tweak,
      hasLogo: !!processedLogoPng,
    });

    // ---- Call Gemini ----------------------------------------------------
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: prompt }];
    if (processedLogoPng) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: processedLogoPng.toString('base64'),
        },
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: parts,
      config: { responseModalities: ['IMAGE'] } as any,
    });

    const candidate = response.candidates?.[0];
    const candidateParts = candidate?.content?.parts ?? [];
    let generatedPng: Buffer | null = null;
    for (const p of candidateParts) {
      const anyP = p as any;
      if (anyP?.inlineData?.data) {
        generatedPng = Buffer.from(anyP.inlineData.data, 'base64');
        break;
      }
    }

    if (!generatedPng) {
      return NextResponse.json(
        {
          error:
            'Gemini did not return an image. Verify GEMINI_API_KEY has access to ' +
            MODEL_NAME +
            '.',
        },
        { status: 502 },
      );
    }

    // ---- Composite real logo on top -----------------------------------
    let finalPng = generatedPng;
    if (processedLogoPng) {
      try {
        finalPng = await compositeLogoOnMockup(generatedPng, processedLogoPng, {
          sideLogoHeightRatio: 0.32,
          sideLogoCenterXRatio: 0.5,
          sideLogoCenterYRatio: 0.55,
          hoodLogoEnabled: false,
        });
      } catch (err) {
        console.warn('[generate-concept] composite failed:', err);
        finalPng = generatedPng;
      }
    }

    const imageDataUrl = 'data:image/png;base64,' + finalPng.toString('base64');

    const result: ConceptResult = {
      id:
        variation +
        '-' +
        Math.random().toString(36).slice(2, 8) +
        '-' +
        Date.now().toString(36),
      label: VARIATION_DETAILS[variation].label,
      imageDataUrl,
      promptUsed: prompt,
      variation,
      tweakNote: tweak || undefined,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[generate-concept] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error.' },
      { status: 500 },
    );
  }
}

function guessMime(filename: string): string {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}
