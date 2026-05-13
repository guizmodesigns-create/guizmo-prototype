// =========================================================================
// lib/industryPrompts.ts
//
// The single most important quality lever in this app. Each industry maps
// to a structured fragment that gets injected into the Gemini prompt. This
// is what makes an HVAC truck actually feel HVAC (snowflakes, thermometer
// split, blue+orange), and a plumbing van feel plumbing (pipe wrench, water
// drops, classic blue+red), instead of a generic colorful wrap.
//
// EXTEND THIS FILE by adding a new entry to INDUSTRY_PROMPTS. Each entry
// can override any of the fields. `motifs` and `palette` carry the most
// signal in the final image.
// =========================================================================

import type { IndustryKey, VibeKey } from './types';

export interface IndustryFragment {
  /** Friendly label used in the UI. */
  label: string;
  /** Short headline used on the industry card. */
  headline: string;
  /** A 1-line emoji/icon hint (used by the UI). */
  icon: string;
  /** Visual motifs to inject as `keyElements` candidates. */
  motifs: string[];
  /** Suggested palette descriptor (used when "Surprise me" is on). */
  paletteDescriptor: string;
  /** A bold one-liner of "energy" the design should radiate. */
  energy: string;
  /** Sentence(s) added to the prompt's INDUSTRY section. */
  promptFragment: string;
}

export const INDUSTRY_PROMPTS: Record<IndustryKey, IndustryFragment> = {
  construction: {
    label: 'Construction',
    headline: 'Build it big.',
    icon: '🏗️',
    motifs: [
      'hard hat silhouette',
      'crossed hammer + level',
      'blueprint grid pattern',
      'bold geometric diagonals',
      'tool icons (saw, drill, hammer)',
    ],
    paletteDescriptor:
      'safety orange (#FF6A00) or hi-vis yellow (#F2C200) paired with deep charcoal/black, optional steel-blue accents',
    energy: 'BUILD energy — solid, heavy, unmistakable from 50 feet away',
    promptFragment:
      'INDUSTRY: Construction / general contracting. Use motifs that signal building trades — hard hats, crossed tools, blueprint grids, bold diagonal color blocks. Lean into safety orange or hi-vis yellow with charcoal/black. The wrap should feel HEAVY DUTY and impossible to miss on a jobsite.',
  },
  plumbing: {
    label: 'Plumbing',
    headline: 'Pipes, drains, water — owned.',
    icon: '🔧',
    motifs: [
      'pipe wrench icon',
      'water drop motifs',
      'connected pipe network pattern',
      'faucet silhouette',
      '"24/7 EMERGENCY" callout',
    ],
    paletteDescriptor:
      'classic plumbing palette — deep royal blue (#0B3D91) and bold red (#D7263D) on white, with optional chrome silver accents',
    energy: '24/7 EMERGENCY energy — dependable, fast, the one you call at 2am',
    promptFragment:
      'INDUSTRY: Plumbing. Use plumbing-specific motifs — pipe wrench, water drops, pipe network patterns, faucet silhouette. Stick to the classic plumbing palette: deep royal blue + bold red on white. Include "24/7" or "Emergency" energy if it fits. This is the truck people see in their driveway during a midnight burst pipe — it must look immediately recognizable as plumbing.',
  },
  hvac: {
    label: 'HVAC',
    headline: 'Heating, cooling, comfort.',
    icon: '❄️',
    motifs: [
      'snowflake graphic (cold side)',
      'sun / flame graphic (hot side)',
      'thermometer split-graphic (hot half / cold half)',
      'air flow swirl patterns',
      'gear / fan icons',
    ],
    paletteDescriptor:
      'dual-temperature palette — cool blue (#0067C0) on one side, warm orange/red (#E84A1F) on the other, often split diagonally',
    energy: 'COMFORT energy — the "hot or cold, we got you" duality',
    promptFragment:
      'INDUSTRY: HVAC (heating + cooling). Use the iconic HVAC split-graphic — snowflakes/cool-blue on one half of the vehicle, sun-or-flames/warm-orange on the other half, divided by a clean diagonal or wave. Thermometer graphics, air flow swirls, fan/gear icons. This is the visual language that says "we do both heat AND air" at a glance.',
  },
  electrical: {
    label: 'Electrical',
    headline: 'Power. Wired right.',
    icon: '⚡',
    motifs: [
      'lightning bolt icon',
      'circuit board line patterns',
      'power outlet / plug silhouette',
      'caution stripes',
      '"LICENSED ELECTRICIAN" callout',
    ],
    paletteDescriptor:
      'high-contrast caution palette — electric yellow (#FFD000) and jet black, with optional red caution accents',
    energy: 'POWER energy — high-voltage, alert, confident',
    promptFragment:
      'INDUSTRY: Electrical contractor. Use electrical motifs — lightning bolts, circuit board line patterns, power plug silhouettes, hazard/caution striping. Stick to the high-contrast electrician palette: electric yellow + jet black. The wrap should feel like a warning sign you respect — high-voltage energy.',
  },
  landscaping: {
    label: 'Landscaping',
    headline: 'Green, growing, sharp.',
    icon: '🌿',
    motifs: [
      'leaf and grass-blade silhouettes',
      'tree outline / canopy shape',
      'flowing organic curves',
      'lawn-stripe pattern',
      'sun / mountain horizon graphic',
    ],
    paletteDescriptor:
      'natural earth palette — deep forest green (#1F6B3A), sun yellow (#F2C200), warm earth brown (#5A3A22), with cream highlights',
    energy: 'OUTDOOR energy — clean cuts, healthy growth, weekend-ready',
    promptFragment:
      'INDUSTRY: Landscaping / lawn care. Use organic motifs — leaves, grass blades, tree silhouettes, flowing curves, and mower-stripe patterns. Lean into earth tones: forest green, warm brown, sun yellow, cream. The wrap should feel ALIVE and outdoor, not corporate.',
  },
  roofing: {
    label: 'Roofing',
    headline: 'Top to bottom.',
    icon: '🏠',
    motifs: [
      'pitched-roof / house silhouette',
      'shingle texture pattern',
      'ladder iconography',
      'sun + clouds horizon',
      '"FREE INSPECTION" callout',
    ],
    paletteDescriptor:
      'sky-and-shingle palette — slate gray (#3B4A5A), sky blue (#5BA3D0), shingle brown (#704028), with white panels',
    energy: 'OVERHEAD energy — protective, sturdy, all-weather',
    promptFragment:
      'INDUSTRY: Roofing. Use roofing motifs — pitched house silhouettes, shingle textures, ladder icons, weather/sky graphics. Slate gray + sky blue + shingle brown palette. The wrap should immediately read as a roofer who handles storm damage and full re-roofs.',
  },
  cleaning: {
    label: 'Cleaning Services',
    headline: 'Bright, fresh, gone.',
    icon: '✨',
    motifs: [
      'sparkle / star burst icons',
      'soap bubble cluster',
      'broom / spray bottle silhouettes',
      'clean linear sheen / shine',
      '"SATISFACTION GUARANTEED" callout',
    ],
    paletteDescriptor:
      'fresh palette — mint green (#3DBE8B) or sky blue (#5BC0EB) with bright white and sun-yellow accents',
    energy: 'FRESH energy — squeaky-clean, light, immediately trustworthy',
    promptFragment:
      'INDUSTRY: Cleaning services (residential or commercial). Use clean motifs — sparkles, soap bubbles, sheen/shine lines, broom or spray bottle silhouettes. Bright fresh palette: mint or sky blue + white + sun yellow. The wrap should LOOK CLEAN — generous white space, no clutter.',
  },
  'mobile-services': {
    label: 'Mobile Services',
    headline: 'We come to you.',
    icon: '🛞',
    motifs: [
      'wheels in motion / motion lines',
      '"ON-SITE" callout',
      'wrench + spanner crossed icon',
      'speed swoosh graphics',
      'service-area map outline',
    ],
    paletteDescriptor:
      'high-energy palette — vibrant red (#E63946) or electric blue with charcoal, plus optional chrome silver accents',
    energy: 'ON-THE-GO energy — fast response, mobile, dependable',
    promptFragment:
      'INDUSTRY: Mobile services / on-site repair. Use motion motifs — wheel-spin lines, speed swooshes, crossed wrench/spanner icons, "ON-SITE" or "WE COME TO YOU" callouts. High-energy vibrant palette with charcoal. The wrap should feel like the truck is already in motion even when parked.',
  },
  delivery: {
    label: 'Delivery / Logistics',
    headline: 'Delivered. On time.',
    icon: '📦',
    motifs: [
      'directional arrow graphics',
      'stacked box / parcel icons',
      'subtle motion blur / speed lines',
      'route map line graphic',
      '"FAST. RELIABLE." callout',
    ],
    paletteDescriptor:
      'dependable palette — navy blue (#1A2A66) and bold red (#E63946) on white, with light gray accents',
    energy: 'ON-TIME energy — reliable, tracked, no surprises',
    promptFragment:
      'INDUSTRY: Delivery / logistics. Use logistics motifs — directional arrows, stacked parcel icons, subtle motion blur, route-line graphics. Stick to a dependable navy + red + white palette. The wrap should feel like a fleet truck people instinctively trust to deliver on time.',
  },
  'food-truck': {
    label: 'Food Truck',
    headline: 'Hungry yet?',
    icon: '🌮',
    motifs: [
      'chef hat icon',
      'crossed utensils (fork + knife)',
      'steam / sizzle swirls',
      'menu-board chalk lettering',
      'food illustration accents',
    ],
    paletteDescriptor:
      'appetizing palette — warm tomato red (#D7263D), mustard yellow (#F2C200), charcoal, and cream — colors that make people hungry',
    energy: 'APPETITE energy — bold flavors, big lettering, irresistible',
    promptFragment:
      'INDUSTRY: Food truck / mobile food vendor. Use food-vendor motifs — chef hat, crossed utensils, steam swirls, big chalkboard-style menu typography, food-illustration accents. Use an appetizing palette of tomato red, mustard yellow, charcoal, and cream. The wrap should make someone two lanes over instantly hungry.',
  },
  'real-estate': {
    label: 'Real Estate',
    headline: 'Doors, opened.',
    icon: '🔑',
    motifs: [
      'house / roof silhouette',
      'key icon',
      'thin elegant rule lines',
      'agent name plate-style typography',
      '"SOLD" badge accent',
    ],
    paletteDescriptor:
      'sophisticated palette — deep charcoal (#1A1A1A) and warm cream (#F2EAD3), with a single accent color from the agency brand (often burgundy, gold, or teal)',
    energy: 'SOPHISTICATED energy — calm, trustworthy, premium-but-not-flashy',
    promptFragment:
      'INDUSTRY: Real estate / realtor. Use real estate motifs — house/roof silhouette, key icon, agent-nameplate typography. Sophisticated muted palette: charcoal + cream + one accent. The wrap should feel like a high-end agent — confident but not loud.',
  },
  other: {
    label: 'Other',
    headline: "Tell us what you do.",
    icon: '🛠️',
    motifs: [
      'clean wordmark-led layout',
      'simple geometric accents',
      'one strong focal logo placement',
    ],
    paletteDescriptor:
      'a flexible palette appropriate to the business — let the designer choose',
    energy: 'CLEAR energy — make it unmistakable what this business does',
    promptFragment:
      'INDUSTRY: General service business. Without industry-specific motifs to lean on, focus on a strong wordmark-led layout, a clear focal logo placement, and one or two simple geometric accents. Let the color palette do most of the work.',
  },
};

// =========================================================================
// Vibe descriptors — paired with industry fragments in the prompt.
// =========================================================================

export const VIBE_DESCRIPTORS: Record<VibeKey, { label: string; description: string }> = {
  'bold-loud': {
    label: 'Bold & Loud',
    description:
      'high-contrast, oversized graphics, sweeping diagonal color blocks, dramatic shadows, attention-grabbing energy — built to turn heads from a block away',
  },
  'clean-professional': {
    label: 'Clean & Professional',
    description:
      'restrained layout, balanced negative space, clean sans-serif type, trustworthy and refined — the kind of truck a CFO would hire',
  },
  'rugged-industrial': {
    label: 'Rugged & Industrial',
    description:
      'utilitarian stencil-style graphics, distressed textures, heavy slab type, work-truck toughness, no-nonsense energy',
  },
  'playful-friendly': {
    label: 'Playful & Friendly',
    description:
      'rounded shapes, friendly illustrative elements, bright saturated colors, characterful and approachable — the truck kids point at',
  },
};
