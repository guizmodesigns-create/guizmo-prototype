// =========================================================================
// lib/styleDNA.ts
//
// Designer-caliber style briefs for every vibe option. Each entry gives
// Gemini the same specificity a senior creative director would give a junior
// designer in a real agency brief. Vague words like "modern" or "bold" are
// replaced with named references, composition rules, and explicit avoidances.
//
// Keys match VibeKey from lib/types.ts
// =========================================================================

import type { VibeKey } from './types';

export interface StyleDNA {
  /** Human-readable label matching the UI. */
  label: string;
  /** How the design is laid out — composition rules. 2–4 sentences. */
  composition: string;
  /** Type treatment — specific typefaces, sizing logic, hierarchy. 1–2 sentences. */
  typography: string;
  /** How colors are used — contrast, proportion, application rules. 2 sentences. */
  colorPhilosophy: string;
  /** 2–3 specific real-world references the AI knows (brand names, campaigns, etc.). */
  references: string;
  /** 5–8 tone/energy adjectives, comma-separated. */
  energyKeywords: string;
  /** What NOT to do — specific anti-patterns for this style. 1–2 sentences. */
  avoidList: string;
  /**
   * The full multi-sentence brief injected directly into the Gemini prompt.
   * Written like a creative director briefing a designer. 6–10 sentences.
   * Be SPECIFIC: name exact references, composition rules, typefaces, and
   * color rules. Reduce all ambiguity.
   */
  promptFragment: string;
}

export const STYLE_DNA: Record<VibeKey, StyleDNA> = {
  // -------------------------------------------------------------------------
  // BOLD & LOUD
  // -------------------------------------------------------------------------
  'bold-loud': {
    label: 'Bold & Loud',
    composition:
      'Asymmetric layout dominated by a single massive focal graphic occupying at least 55% of the visible vehicle side. Primary design element breaks aggressively across panel lines — hood to fender, fender to door — without respecting the panel grid. Sweeping diagonal or angular color blocks (not horizontal bands) carry energy from front bumper toward the rear. The vehicle should look like it is moving at 80mph even when parked.',
    typography:
      'Condensed extra-bold or black-weight sans-serif or display typeface — think Impact, Bebas Neue, Tungsten, or Barlow Condensed Black — sized so the business name reads from 50 feet away at 10mph. Letterforms are stacked, stretched, or set in a dramatic angle, never in a flat horizontal baseline.',
    colorPhilosophy:
      'Maximum three colors, at least one of which is eye-searingly saturated — electric orange, chrome yellow, racing red, or neon anything. The lightest color (usually white) is used for type only; the darkest color (usually near-black) functions as the "ground" that makes the saturated accent explode.',
    references:
      'NASCAR Monster Energy liveries (2015–2023), Roland Sands Design custom motorcycles, NHRA Top Fuel dragster wraps, vintage Marlboro McLaren F1 livery proportions, Berliner-Brot Expressionist poster typography',
    energyKeywords:
      'explosive, aggressive, kinetic, unapologetic, high-octane, street-dominant, zero-to-sixty',
    avoidList:
      'Never center the composition symmetrically — symmetric equals generic. Never use gradients that fade to white or black; use hard-edge color transitions or dramatic gradient sweeps only. No thin decorative lines or filigree. No pastel or muted versions of "bold" colors.',
    promptFragment:
      'STYLE: Bold & Loud. Channel the energy of a NASCAR Monster Energy livery or a Roland Sands Design custom — this is a WEAPON on wheels, not a business card. The composition must be violently asymmetric: one colossal graphic element (the industry motif, a flame, a speed shape, or the logo blown up 4x) anchors the entire design and bleeds off at least two edges. Color blocking uses hard diagonal cuts, not soft gradients — think Marlboro McLaren red-and-white geometry at race-car scale. Typography is condensed black or extra-bold, set at a dramatic angle or stacked vertically, with letterforms so large they are readable at a full city block. The palette is maximum three colors: one near-black ground, one blinding saturated accent (electric orange, chrome yellow, hot red), and white for text only. Speed lines, angular stripes, or motion-blur graphics run the full length of the vehicle and reinforce directionality — this truck is always leaving you behind. Every graphic element should feel like it was applied with a spray gun at 200mph. The finished vehicle should look like it belongs in the SEMA show display hall, not a parking lot. Avoid any symmetric centering, soft gradients fading to neutral, or thin decorative details.',
  },

  // -------------------------------------------------------------------------
  // CLEAN & PROFESSIONAL
  // -------------------------------------------------------------------------
  'clean-professional': {
    label: 'Clean & Professional',
    composition:
      'Restrained horizontal layout with generous negative space — the white or light ground IS part of the design, not a failure to fill space. Primary logo and business name anchor the front door panel in the lower-third or center zone. All other elements (tagline, phone, URL) are arranged in a disciplined invisible grid with consistent internal margins. Think of the side of the vehicle as a white-space composition where every placed element has earned its position.',
    typography:
      'Clean geometric sans-serif — Futura, Gill Sans, Montserrat SemiBold, or a Helvetica-adjacent neutral — set in mixed case (not all-caps except for short callouts). Type hierarchy has exactly three levels: large name, medium tagline, small contact info. Type is never decorative; it is pure communication.',
    colorPhilosophy:
      'Two-color palette maximum plus white: one deep anchor color (navy, charcoal, forest, burgundy) and one single brand-defining accent (a controlled teal, gold, or steel blue). White accounts for at least 50% of visible vehicle surface. The color is used to define zones, rule lines, or a single clean stripe — not fill entire panels.',
    references:
      'Tesla fleet service vehicles, Apple retail uniform (clean white + product color), Helvetica-era Swiss International Typographic Style, mid-century airline liveries (Braniff International "flying colors"), modern law firm partner-level branding',
    energyKeywords:
      'authoritative, restrained, precise, trustworthy, considered, investment-grade, CFO-approved',
    avoidList:
      'Never use drop shadows, bevels, or emboss effects on type — those are signs of amateur design. No gradients that blend two competing colors; only flat fields. No clip-art-style industry icons. Absolutely no "swoosh" shapes or generic motion lines. The design should feel like it could appear on a Pentagram portfolio page.',
    promptFragment:
      'STYLE: Clean & Professional. Design this like a Pentagram partner was handed the brief and had three weeks and a $40,000 budget. The reference mental image is a Tesla fleet service van, or the side of an Apple Keynote stage set — immaculate white field, one controlled color, one perfect logo, and nothing else competing for attention. The vehicle body is predominantly white or a very light neutral. One thin (1–2 inch) accent stripe in a deep anchor color (navy, charcoal, or forest green) runs the full horizontal length of the side, about one-third from the bottom. The logo appears on the forward door panel at a dignified but readable size — never oversized, never undersized. Business name is set in Futura, Montserrat SemiBold, or Helvetica equivalent — mixed case, never all-caps — in the same anchor color as the stripe. Tagline and contact info are set in a noticeably smaller size, precise alignment, with breathing room around them. No decorative elements, no shadows, no gradients blending competing colors, no swoosh shapes. The finished result should feel like the kind of truck a CFO, a doctor, or a private equity partner would hire — immediately trustworthy and tastefully assertive. Less is rigorously enforced.',
  },

  // -------------------------------------------------------------------------
  // RUGGED & INDUSTRIAL
  // -------------------------------------------------------------------------
  'rugged-industrial': {
    label: 'Rugged & Industrial',
    composition:
      'Utility-forward layout built from bold rectangular color blocks and stencil-style graphic elements — like military supply vehicle markings translated to commercial fleet. Primary graphic (either a large industry motif or a distressed wordmark) dominates the door area in a way that suggests it was stenciled on in a factory, not designed in a boutique. Supporting geometric elements are simple — stripes, angle cuts, block color fields — never decorative. The vehicle should look like it gets the job done before it looks like it was designed.',
    typography:
      'Slab serif or condensed industrial display type — Rockwell Bold, Clarendon, Tungsten, or a stencil-cut face — all-caps, set wide with tracked letters to fill horizontal space. Type can be oversized, set in a single-color block treatment, or reverse-white-out of a dark panel. No script, no humanist sans, no friendly rounded letters.',
    colorPhilosophy:
      'Dark and earthy: deep charcoal (#1A1A1A), oil-drum gray (#3B4A5A), raw steel blue, or worn army olive as the dominant ground. One punchy accent — caution yellow (#F2C200), safety orange, or blood red — used sparingly for type, callout badges, or a single structural stripe. The design should look like it could survive a construction site.',
    references:
      'Carhartt brand language (WIP line especially), Filson catalog cover design, Yeti coolers color and texture vocabulary, WWII supply vehicle identification markings, vintage Harley-Davidson Racing graphics, John Deere fleet utility trucks',
    energyKeywords:
      'battle-hardened, no-nonsense, utilitarian, respect-earning, workhorse, field-proven, built-not-bought',
    avoidList:
      'No soft gradients, no curved swoosh shapes, no friendly rounded letterforms, no pastel color anywhere. Never make it look designed by a marketing agency — the grit and directness must feel earned, not stylized. No thin decorative borders or filigree. No lifestyle photography style elements.',
    promptFragment:
      'STYLE: Rugged & Industrial. The design reference is Carhartt-meets-Yeti-meets-military-surplus — this vehicle looks like it has been to a worksite and earned every scratch. The base palette is deep charcoal, steel gray, or army olive as the dominant ground color. One tactical accent — caution yellow or safety orange — punches through in structural stripes, badging, or text. The logo treatment should look like it was silk-screened or stenciled onto the vehicle in a factory: oversized, flat, zero-shadow. Typography is slab serif or stencil-cut condensed — Rockwell Bold, Clarendon, or Tungsten — all caps, tracked wide, white or caution-yellow reversed out of a dark panel. The industry motif (wrench, saw, pipe, snowflake, etc.) is rendered in a flat two-color, stamp-style graphic — NOT a glossy vector illustration. Distressed texture overlays (not photographic noise, but intentional grain and edge-wear patterns) are applied to background panels to age the design without looking dirty. Think of the finishing aesthetic: Yeti Tundra cooler label art, WWII Jeep nose art on a bomber, Filson product catalog — functional, honest, forged. Avoid curves, soft gradients, or any element that suggests a design committee reviewed it.',
  },

  // -------------------------------------------------------------------------
  // PLAYFUL & FRIENDLY
  // -------------------------------------------------------------------------
  'playful-friendly': {
    label: 'Playful & Friendly',
    composition:
      'Energetic asymmetric layout with rounded, bubbly graphic shapes that overlap and stack rather than sitting in clean grid zones. The hero illustration (always a character, mascot, or scene — not just an icon) is large, warm, and occupies the door panel like a mural. Supporting elements use overlapping blobs, speech-bubble shapes, or thick rounded frames. The vehicle should make people smile before they read a single word.',
    typography:
      'Rounded bold display type — Brandon Grotesque, Nunito ExtraBold, Filson Pro, or a hand-crafted custom lettering feel — mixed case, slightly bouncy baseline, generous letter-spacing. Type should feel like it was hand-painted by someone who loves their job, not set in a template.',
    colorPhilosophy:
      'Full saturated palette of 3–4 colors (never desaturated), each color warm and inviting — think ice cream shop: sky blue, grass green, sunshine yellow, and coral pink. Colors fill large clean fields, not gradients. Contrast comes from juxtaposing warm and cool saturated hues, not from dark-on-light alone. Every color should make a child point at it.',
    references:
      "Ben & Jerry's ice cream packaging (Wavy Gravy era), Innocent Drinks illustration style, Mollusk Surf Shop poster art, vintage 1960s circus poster type, San Diego taco truck graphic culture, Trader Joe's store art",
    energyKeywords:
      'warm, approachable, joyful, neighbourhood-favourite, kid-magnetic, Saturday-morning, full-of-life',
    avoidList:
      "Never let this slide into childish or cheap — there is a difference between playful and clip-art. No Comic Sans or Papyrus typefaces. No rainbow gradients. No drop shadows on top of drop shadows. The design should be charming enough that a design-savvy parent appreciates it, not just their 6-year-old.",
    promptFragment:
      "STYLE: Playful & Friendly. The design reference is Ben & Jerry's Chunky Monkey packaging crossed with Innocent Drinks brand illustration — warmth, wit, and craftsmanship that makes adults smile and kids beg their parents to take a photo. The hero visual is a large, lovingly detailed illustration: a happy mascot character, a cartoon scene of the business in action, or a joyful interpretation of the industry's subject matter (a grinning dog for pet services, a smiling sun for landscaping, a wavy pizza for food trucks). This illustration fills the door panel as the undisputed star of the design. Color palette is 3–4 fully saturated but harmonious hues — sky blue, grass green, sunshine yellow, coral, or mint — applied in large clean flat fields, never gradients. Typography is rounded and slightly bouncy — Nunito ExtraBold, Brandon Grotesque, or a hand-lettered custom feel — mixed case, set generously large and legible. All shapes (frames, callout badges, logo container) use soft rounded corners, never hard right angles. The overall effect should feel like the van that shows up at a kids' birthday party and everyone cheers. Avoid anything that looks clipped from a stock art library, avoid dark color schemes, and avoid any design element that feels corporate or intimidating.",
  },
};
