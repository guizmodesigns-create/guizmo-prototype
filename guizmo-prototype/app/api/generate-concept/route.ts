import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { Intake, DesignBrief, ConceptResult } from '@/lib/types';
import { processLogo } from '@/lib/processLogo';
import { INDUSTRY_PROMPTS } from '@/lib/industryPrompts';
import { STYLE_DNA } from '@/lib/styleDNA';

// =========================================================================
// /api/generate-concept  (v3.2 — DNA Briefs + Layered Prompt)
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

// =========================================================================
// VARIATION BRIEFS — each variation gets its own camera angle + design brief
// =========================================================================
const VARIATION_BRIEFS: Record<
  Variation,
  { label: string; cameraAngle: string; brief: string }
> = {
  'front-heavy': {
    label: 'Front-Heavy',
    cameraAngle: 'three-quarter front view, dramatic low angle',
    brief:
      'Hero graphic dominates the hood and front quarter panel. The design EXPLODES from the front like a curling wave or speed graphic. Front fender treatment is aggressive. Rear of vehicle is calmer — let the front carry the energy.',
  },
  'side-panel': {
    label: 'Side-Panel Focus',
    cameraAngle: 'pure side profile, eye-level',
    brief:
      'ONE massive hero illustration centered on the door panels, taking up 60%+ of the side. Treat the door as a billboard. Surrounding panels are quiet supporting players. Think of it like an album cover stretched across the side of the vehicle.',
  },
  'full-coverage': {
    label: 'Full Coverage',
    cameraAngle: 'three-quarter rear view, slight low angle',
    brief:
      'A SINGLE continuous design wraps from front bumper to rear bumper without interruption. Graphics flow across panel lines like water. Color gradients shift along the length of the vehicle. The vehicle should feel like one cohesive sculptural object.',
  },
  'accent-heavy': {
    label: 'Accent Mix',
    cameraAngle: 'three-quarter front view, eye-level',
    brief:
      'Bold decorative stripes, geometric shapes, or speed lines run the length of the vehicle as a recurring graphic system. The logo and key info live in clean negative-space pockets. Think racing livery or motorsport sponsor placement — disciplined and rhythmic.',
  },
};

interface MockupArgs {
  intake: Intake;
  brief: DesignBrief;
  variation: Variation;
  tweak?: string;
  hasLogo: boolean;
  hasHeroImage: boolean;
  heroByteSize?: number;
}

// =========================================================================
// LAYERED PROMPT BUILDER — v3.2
// Each section is a named, labeled block so Gemini processes them as
// distinct creative directives rather than a wall of text.
// =========================================================================
function buildPrompt(args: MockupArgs): string {
  const { intake, brief, variation, tweak, hasLogo, hasHeroImage, heroByteSize } = args;
  const veh = intake.vehicle;
  const vehicleLine = `${veh.year} ${veh.make} ${veh.model}${veh.trim ? ' ' + veh.trim : ''}`;

  const industry = INDUSTRY_PROMPTS[intake.industry] ?? INDUSTRY_PROMPTS.other;
  const industryLabel =
    intake.industry === 'other' && intake.industryOther
      ? `Other — ${intake.industryOther}`
      : industry.label;

  const styleDna = STYLE_DNA[intake.vibe] ?? STYLE_DNA['bold-loud'];
  const variationBrief = VARIATION_BRIEFS[variation];

  // ---- PHONE (exact digits) ----
  const exactPhone = intake.brand.showPhone && intake.brand.phone ? intake.brand.phone : null;

  // ---- COLORS ----
  const colorDirective = intake.colors.surpriseMe
    ? `COLORS: Use a vibrant, saturated, high-contrast palette suited to the ${industryLabel} industry. ${industry.paletteDescriptor}. Lean into the style color philosophy below. Do NOT default to grayscale, black-and-white, muted, or washed-out palettes.`
    : `COLORS: The wrap MUST predominantly use these EXACT customer colors: primary ${intake.colors.primary}, secondary ${intake.colors.secondary}. Apply these as LARGE color fields on the body panels (not just thin accents). Both colors must be clearly visible and dominant across the wrap. Vibrant and saturated — do not mute or desaturate them.`;

  // ---- COVERAGE ----
  let coverageDirective = '';
  if (intake.coverage === 'full') {
    coverageDirective =
      'COVERAGE: Full vehicle wrap. Graphics, patterns, and color MUST cover 100% of visible body panels — hood, doors, side panels, rear, fenders, roof edge. Do NOT leave any unwrapped body color showing.';
  } else if (intake.coverage === 'partial') {
    coverageDirective =
      'COVERAGE: Partial wrap. Graphics cover roughly 50–60% of the body with a clean transition line. Focus color on doors and lower body panels. Upper portion has intentional negative space.';
  } else {
    coverageDirective =
      'COVERAGE: Decals + lettering only. Vehicle retains its original body color. Apply the business name in stylized vinyl lettering and the logo to the side panel. No background color fields or full-panel graphics.';
  }

  // =========================================================================
  // ASSEMBLE THE LAYERED BRIEF
  // =========================================================================
  const sections: string[] = [];

  // --- PREAMBLE ---
  sections.push(
    `You are an award-winning vehicle wrap designer creating one concept among several variations. Treat this as a creative brief, not a generic request. Render an editorial-quality, SEMA-show-caliber wrap.`,
  );

  // --- VEHICLE ---
  sections.push(
    `=== THE VEHICLE ===
${vehicleLine}. View: ${variationBrief.cameraAngle}.
Photorealistic 3D render. Studio lighting, neutral gray seamless background, subtle ground shadow. The vehicle fills most of the frame and its silhouette is accurate to this exact year/make/model.`,
  );

  // --- CUSTOMER ---
  const customerLines: string[] = [
    `Business: ${intake.brand.showBusinessName && intake.brand.businessName ? intake.brand.businessName : '(not specified)'}`,
  ];
  if (intake.brand.showTagline && intake.brand.tagline) {
    customerLines.push(`Tagline: ${intake.brand.tagline}`);
  }
  if (exactPhone) {
    customerLines.push(
      `Phone (use EXACTLY this — do NOT invent other digits): ${exactPhone}`,
    );
  }
  if (intake.brand.showWebsite && intake.brand.website) {
    customerLines.push(`Website: ${intake.brand.website}`);
  }
  sections.push(`=== THE CUSTOMER ===\n${customerLines.join('\n')}`);

  // --- INDUSTRY BRIEF ---
  sections.push(
    `=== INDUSTRY BRIEF ===
${industry.dnaFragment}

Required iconography (must include at least one): ${industry.motifs.join(', ')}.
Palette anchor: ${industry.paletteDescriptor}.
${colorDirective}
${coverageDirective}`,
  );

  // --- STYLE BRIEF ---
  sections.push(
    `=== STYLE BRIEF ===
${styleDna.promptFragment}

Composition: ${styleDna.composition}
Typography: ${styleDna.typography}
Colors: ${styleDna.colorPhilosophy}
References to channel: ${styleDna.references}
Energy: ${styleDna.energyKeywords}
AVOID: ${styleDna.avoidList}`,
  );

  // --- VARIATION DIRECTION ---
  sections.push(
    `=== VARIATION DIRECTION ===
${variationBrief.brief}`,
  );

  // --- DESIGNER NOTES (brief from client) ---
  sections.push(
    `=== DESIGNER NOTES ===
Layout direction — ${brief.layout}. Typography direction — ${brief.typography}. Key design elements — ${brief.keyElements.join(', ')}.`,
  );

  // --- LOGO ---
  const logoSection = hasLogo
    ? `=== LOGO (CRITICAL) ===
The reference image is the customer's EXACT logo. Render it accurately on the door panel at 30–40% of door height. Same colors, same shape, same proportions. Do NOT redraw, restyle, or simplify the logo. Treat it like a print file. Do NOT distort it to fit the surface. Do NOT invent alternate logo designs.`
    : intake.brand.showBusinessName && intake.brand.businessName
    ? `=== LOGO (CRITICAL) ===
No logo file provided. Render the business name "${intake.brand.businessName}" as STYLIZED TYPOGRAPHY appropriate to the chosen vibe — treat the wordmark itself as the focal logo. Make the type bold and unmistakable. Spell it EXACTLY as written.`
    : `=== LOGO (CRITICAL) ===
No logo or business name provided. Use a strong abstract focal mark based on the industry motifs as the centerpiece of the design.`;
  sections.push(logoSection);

  // --- TEXT ---
  const textLines: string[] = [];
  if (intake.brand.showBusinessName && intake.brand.businessName) {
    textLines.push(
      `Render the business name "${intake.brand.businessName}" prominently and LEGIBLY. Spell it EXACTLY — letter-for-letter, no substitutions.`,
    );
  }
  if (intake.brand.showTagline && intake.brand.tagline) {
    textLines.push(
      `Include the tagline "${intake.brand.tagline}" in smaller secondary type beneath the business name.`,
    );
  }
  if (exactPhone) {
    textLines.push(
      `Include the phone number "${exactPhone}" in clearly readable type. These digits MUST be exactly "${exactPhone}" — do NOT substitute or invent any other number sequence.`,
    );
  }
  if (intake.brand.showWebsite && intake.brand.website) {
    textLines.push(
      `Include the website "${intake.brand.website}" in a clearly readable smaller line.`,
    );
  }
  if (textLines.length) {
    sections.push(`=== TEXT ON VEHICLE ===\n${textLines.join('\n')}`);
  }

  // --- HERO REFERENCE IMAGE ---
  if (hasHeroImage) {
    const imgOrdinal = hasLogo ? 'second' : 'first';
    sections.push(
      `=== HERO REFERENCE IMAGE (CRITICAL — ${imgOrdinal} attached image) ===
A reference image has been attached as the ${imgOrdinal} image in this request (approximate size: ${heroByteSize ? Math.round(heroByteSize / 1024) + 'KB' : 'see attached'}). You MUST do ALL of the following:
1. Pull the dominant color palette from this image and use those exact colors in the wrap — they override the "surprise me" palette if there is a conflict.
2. Identify the subject matter (mower, tools, dog, lawn, truck, etc.) and incorporate that subject as a recognizable graphic element on the wrap body panels.
3. Match the mood and lighting energy of the reference — if it is warm and golden, make the wrap warm and golden; if it is high-contrast and dramatic, match that energy.
4. The wrap must still be a vehicle wrap with the customer's logo — but the visual world must clearly echo this reference image.
Do NOT ignore this image. Do NOT treat it as decorative. It is a CREATIVE DIRECTIVE.`,
    );
  }

  // --- HARD RULES ---
  const hardRules: string[] = [
    'Asymmetric composition. Never centered or symmetric.',
    'Oversized graphics that wrap edge to edge, not contained within bordered panels.',
    'One dominant focal element occupying 50%+ of the visible side.',
    'Vehicle must look like it is moving even when parked.',
    'Photo-realistic 3D vehicle render, studio lighting, neutral gray seamless background.',
  ];
  if (exactPhone) {
    hardRules.push(
      `Phone digits must be EXACTLY "${exactPhone}" — do NOT invent any other number. This is the single most common error — guard against it.`,
    );
  }
  hardRules.push(
    'Output: a single high-resolution side-profile or three-quarter vehicle photograph showing the finished wrap.',
    'Do NOT show people, hands, or other vehicles. Do NOT add fake URLs or placeholder text.',
    'Do NOT use a stock photo aesthetic or a generic vinyl-wrap template look.',
    'Do NOT garble or misspell any text — every letter and digit must be correct and crisp.',
  );
  sections.push(`=== HARD RULES ===\n${hardRules.map((r) => `- ${r}`).join('\n')}`);

  // --- CUSTOMER TWEAK (if regenerating) ---
  if (tweak) {
    sections.push(
      `=== CUSTOMER TWEAK (apply this on top of everything above) ===\n${tweak}`,
    );
  }

  return sections.join('\n\n');
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
      typeof variationRaw === 'string' && variationRaw in VARIATION_BRIEFS
        ? variationRaw
        : 'side-panel'
    ) as Variation;
    const tweak = typeof tweakRaw === 'string' ? tweakRaw : undefined;

    // ---- Hero image: read from form data --------------------------------
    const heroRaw = form.get('heroImageDataUrl');
    const heroImageDataUrl =
      typeof heroRaw === 'string' && heroRaw.startsWith('data:') ? heroRaw : null;

    // Parse hero byte size for logging and prompt context
    let heroByteSize = 0;
    let heroBase64Match: RegExpMatchArray | null = null;
    if (heroImageDataUrl) {
      heroBase64Match = heroImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (heroBase64Match) {
        heroByteSize = Math.round(heroBase64Match[2].length * 0.75); // approximate decoded byte size
      }
    }

    // Log hero image presence for Vercel diagnostic visibility
    console.log(
      `[generate-concept] hero image present: ${!!heroImageDataUrl}, size: ${heroByteSize} bytes`,
    );

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
      hasHeroImage: !!heroImageDataUrl,
      heroByteSize,
    });

    // ---- Call Gemini ----------------------------------------------------
    const ai = new GoogleGenAI({ apiKey });

    // Build the parts array: text prompt first, then images in order
    const parts: any[] = [{ text: prompt }];

    // First reference image: the customer's logo (if provided)
    if (processedLogoPng) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: processedLogoPng.toString('base64'),
        },
      });
    }

    // Second reference image: the customer's hero/inspiration photo (if provided)
    // CRITICAL: we must attach this as inlineData, not just reference it in text.
    if (heroImageDataUrl && heroBase64Match) {
      parts.push({
        inlineData: {
          mimeType: heroBase64Match[1],
          data: heroBase64Match[2],
        },
      });
      console.log(
        `[generate-concept] hero image attached to Gemini request — mimeType: ${heroBase64Match[1]}, data length: ${heroBase64Match[2].length} chars`,
      );
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

    // ---- Sharp composite REMOVED (v3.1) -----------------------------------
    // Previously we pasted the raw logo PNG at 32%-height dead-center over
    // the Gemini output. This was destroying the design by overlaying a
    // white-background logo box onto the generated wrap.
    //
    // Gemini receives the logo as a reference image with a STRONG prompt
    // instruction to place it accurately. Trust Gemini. No Sharp overlay.
    const finalPng = generatedPng;

    const imageDataUrl = 'data:image/png;base64,' + finalPng.toString('base64');

    const result: ConceptResult = {
      id:
        variation +
        '-' +
        Math.random().toString(36).slice(2, 8) +
        '-' +
        Date.now().toString(36),
      label: VARIATION_BRIEFS[variation].label,
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
