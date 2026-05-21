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
// can override any of the fields. `motifs`, `palette`, and `dnaFragment`
// carry the most signal in the final image.
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
  /**
   * A 6–10 sentence designer brief specifically for this industry.
   * Covers iconography specifics, color psychology, real brand references,
   * the scene/moment the wrap should evoke, and what to avoid.
   * Written like a creative director briefing a senior designer.
   */
  dnaFragment: string;
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
    dnaFragment:
      `INDUSTRY BRIEF — Construction: This is the kind of truck that shows up at a $3M custom home build and commands instant respect from the subcontractors. The primary icon is a BOLD crossed-hammer-and-level graphic rendered flat and large — not a realistic 3D rendering, but a strong silhouette like you would see on a safety vest badge blown up to 24 inches. Blueprint grid patterns (fine white lines on a deep navy or charcoal field) work as a secondary texture element behind the main graphic, evoking technical competence without being literal. The color psychology of construction is about high visibility and physical authority: safety orange (#FF6A00) or hi-vis yellow (#F2C200) are the industry's language of "we are HERE and we mean business" — use them as your dominant accent. Real-world references to channel: Caterpillar fleet vehicle yellow-and-black, DeWalt power tool packaging graphics, a premium general contractor truck that parks outside a luxury home renovation in Scottsdale or Greenwich. The scene this wrap should evoke is a jobsite at 7am — crew is arriving, foundation is poured, this truck pulls up and everyone knows the GC is on site. Avoid making it look like a hardware store ad or a safety manual illustration; this is a premium trade business, not a Home Depot promo.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Plumbing: The moment this truck pulls into a driveway at 2am during a burst pipe emergency, the homeowner needs to feel immediate relief. The water drop motif is the industry's most powerful icon — but render it as a BOLD, confident teardrop shape (think the shape Voss water uses, not clip-art), 12–16 inches tall, used in clusters of two or three at slightly varying sizes to suggest flow and movement. A schematic pipe-network pattern (thin lines connecting at right angles, drawn like a technical diagram) works as a repeating background texture on a dark blue panel — subtle, sophisticated, unmistakably "plumbing." Color psychology: deep royal blue (#0B3D91) is trust and clean water; a punch of emergency red (#D7263D) signals 24/7 availability. Real-world fleet references to channel: a Roto-Rooter van at its absolute best visual execution, Service Experts plumbing division trucks in the Pacific Northwest, the kind of plumbing fleet van that parks outside a $1.5M home remodel in Naples, Florida and looks completely at home. Chrome silver accents (thin pinstripes or faucet-metal details) add a premium-feel material contrast. The scene this wrap should evoke: crystal-clear water flowing out of a brand-new high-arc faucet into a spotless white sink — clean, controlled, professional. Avoid cartoon-style drips or clip-art faucets; every element should feel like it was drawn by someone who understands pipe hydraulics.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — HVAC: The most recognizable HVAC wrap in the industry is built on ONE powerful idea — the hot/cold duality — executed with the confidence of a brand identity, not an afterthought. The snowflake must be a REAL geometric snowflake — a six-pointed crystalline form with secondary branching details, NOT a generic asterisk or star. Render it in ice-white or pale arctic blue (#A8D8EA), large (at least 18 inches in the final wrap), with a subtle inner glow that reads as "cold air coming off it." On the opposing half of the vehicle, the heat side uses a stylized sun (clean geometric rays, not a cartoon face) or a tight flame cluster in ember orange (#E84A1F) and amber (#FFA500). The split between hot and cold sides should be a dramatic diagonal wave or a lightning-bolt-shaped edge — not a flat vertical line. Air flow swirls (thin, curved parallel lines that mimic airflow around a fan blade) fill background areas without competing with the hero graphics. Real-world references: One Hour Heating & Air conditioning truck graphics, Carrier commercial fleet vehicles, the kind of HVAC van that wins a contractor trade show display award. The scene this wrap evokes: opening the front door of a perfectly climate-controlled home on a 105-degree July day — instant, blissful relief. Avoid generic thermometer clip art; the thermometer, if used, should be stylized as a graphic element, not a medical illustration.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Electrical: This truck needs to communicate "licensed, insured, and technically superior" at a glance — not just "electrician." The hero motif is a BOLD lightning bolt — but render it as a confident, slightly slanted geometric shape with clean edges (think the original AC/DC logo bolt, not a cartoon zigzag), at least 20 inches tall, in electric yellow (#FFD000) or white depending on the background. Circuit board trace patterns (the fine copper-trace line art from a printed circuit board: thin lines running at 90- and 45-degree angles, connecting to small circular node pads) are the most sophisticated secondary texture available to this industry — use them as a repeating background pattern on a jet-black panel, scaled up so individual traces are about 1/4 inch wide. Yellow-and-black hazard striping (alternating diagonal bars at 45 degrees) is used only as a framing device — for example, along the bottom edge of the door panel or as a narrow stripe along the roofline — not as the dominant graphic. Real-world references: Mister Electric fleet wrap execution, the graphic vocabulary of Fluke Tools packaging, the kind of electrical truck that parks outside a hospital wing installation and looks completely credible. The color psychology: electric yellow is attention, caution, and power simultaneously — it earns respect at a job site in a way that blue or red cannot. The scene this wrap evokes: a panel box opened at 6am by a master electrician who knows exactly what every wire does. Avoid generic "cartoon lightning bolt" clip art; avoid making the design look like a Halloween prop.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Landscaping: This truck should make you smell fresh-cut grass and feel Sunday morning. The hero graphic is a bold, illustrative tree silhouette — not a generic oval tree-blob, but a specific species: a mature oak with visible spreading branch structure, or a neatly pruned arborvitae row as a graphic element, rendered in deep forest green (#1F6B3A) as a flat bold shape. Grass blades are rendered as a clean fan of crisp parallel strokes (like the Nike "swoosh" but as a blade cluster) — tight, precise cuts, not wavy seaweed. Lawn-stripe patterns (alternating light and dark green parallel stripes at a slight angle, evoking the mow pattern on a freshly cut golf fairway) work as a background texture fill on a panel. Sun yellow (#F2C200) is used for warmth and optimism — a stylized sun or a bright horizon line. The color psychology of landscaping is organic confidence: deep greens say growth and expertise, warm earth browns and cream say natural and local, sun yellow says outdoor energy without being industrial. Real-world fleet references: BrightView commercial landscaping fleet trucks (clean, professional), the kind of landscaping truck that shows up at a $5,000/month maintained estate property and looks like it belongs. The scene this wrap should evoke: a Sunday morning in a wealthy suburb, 7:30am, dew still on the grass, the crew arriving silently to make everything perfect. Avoid the generic "grass-and-sun" clip-art landscaping cliché; every plant element should feel botanically considered.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Roofing: This is the truck that arrives after the storm and makes a homeowner feel like everything is going to be fine. The primary motif is a BOLD, angular pitched-roof silhouette — just the roofline geometry, rendered large and clean, in a dark slate gray (#3B4A5A) or deep charcoal. Do not add windows, doors, or siding to the house shape; the pure roofline is the icon. Shingle texture is the industry's most recognizable secondary pattern — render it as a repeating overlapping-arc pattern (like fish scales at a slight horizontal stagger), in a warm shingle brown (#8B5E3C) or weathered gray, sized so 4–6 rows are visible on a door panel. A dramatic sky treatment — deep storm-blue clouds breaking into clear blue sky with a sharp horizon line — can serve as the background "scene" behind the roof motif, evoking both "we handle storm damage" and "blue skies after we're done." Real-world references: Owens Corning roofing contractor fleet wrap standards (their branded trucks consistently use a strong diagonal color block), the kind of roofing truck that parks in a Boca Raton neighborhood post-hurricane and inspires immediate confidence. The color psychology: slate gray conveys durability and material expertise; sky blue conveys clarity, openness, and the promise of "done and approved"; the warm brown is the material itself. The scene this wrap evokes: your roof being re-done on a clear October morning — crew on top, this truck in the driveway, and complete confidence it will be right. Avoid cartoon houses with chimneys and smoke; avoid generic construction aesthetics that could belong to any trade.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Cleaning: The paradox of a cleaning company vehicle is that the wrap itself must function as proof of the work — a cluttered, dark, or dirty-looking wrap actively destroys trust. The design mandate: white accounts for at least 60% of the visible vehicle surface. Sparkle motifs are rendered as precisely drawn four-point star bursts (not generic asterisks — specifically a compressed diamond star shape with four primary points and tiny secondary points at 45 degrees), used in groupings of 3–5 at varying sizes, in gold-white or sky blue. Soap bubble clusters are rendered as semi-transparent overlapping circles with a tiny specular highlight dot — think the visual vocabulary of premium dish soap packaging (Dawn Platinum, Seventh Generation), NOT cartoon circles. A "sheen line" — a thin, slightly curved highlight stroke that implies a just-cleaned glass surface — can be used as a graphic accent across the hood or door panel. Real-world references: Molly Maid fleet truck color vocabulary (clean aqua + white), The Maids brand identity, the kind of cleaning service van that parks outside a $2M home in Palo Alto and the homeowner is not embarrassed to have in the driveway. Color psychology: mint green and sky blue are the colors of clean air and clean water — the two things cleaning companies sell. The scene this wrap evokes: the exact moment you walk into a room that was just cleaned — that specific smell, the shine on the surfaces, the absolute tidiness. Avoid dark backgrounds, avoid cluttered layouts, and absolutely avoid any visual element that reads as dirty, gritty, or rough-edged.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Mobile Services: The core promise of this business is SPEED and CONVENIENCE — the truck is the product. Every design decision should reinforce the feeling of arrival: motion lines, forward momentum, and the visual sense that this vehicle is always moving toward the customer. Crossed-wrench-and-spanner icon is the universal shorthand for mobile repair — render it as a BOLD, flat two-color graphic (dark on light or light on dark), sized at 40–50% of the door panel height, with the wrenches at a slight dynamic angle (not perfectly centered and static). Speed swoosh graphics — fluid curved lines that run from the front fender to the rear, tapering as they go — are the vehicle's "motion trail" even when it's parked. Chrome silver accents (thin pinstripes, chrome-effect text outline, or metallic-look callout badges) add a premium mechanical feel. Real-world references: Jiffy Lube mobile unit graphics, the AAA roadside assistance truck design system, a Best Buy Geek Squad van executed with significantly more design intention. Color psychology: vibrant red is "emergency response," electric blue is "precision technology" — choose based on the service's primary brand feeling. The scene this wrap evokes: your phone dies and you need help NOW — this truck rounds the corner and you know exactly what it does and that it's going to fix your problem. Avoid making the design look like a generic tow company; this is a specialized mobile expert, not a hauler.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Delivery/Logistics: In the delivery industry, trust is built through visual consistency and reliability — this truck should look like it belongs to an operation that never loses a package. The directional arrow is the industry's primary icon — but render it as a BOLD, confident forward-pointing chevron or aerodynamic arrow shape (think FedEx arrow negative-space precision, not a generic PowerPoint arrow), in white or red on a navy field. Parcel box icons are rendered as clean isometric line-art boxes with a lid slightly open and a small "delivered" checkmark — minimal, precise, technical. Route-line graphics (thin curved lines connecting node dots, evoking a delivery route on a map) work as a sophisticated repeating background pattern. Real-world references: FedEx fleet vehicle color discipline (the most studied fleet identity in history), OnTrac delivery van graphic systems, the kind of last-mile delivery truck that services a tech company's corporate campus and looks completely in place. Color psychology: navy blue is trust, reliability, and systems thinking — it says "this organization has its act together"; red is urgency and action — "we move fast and on time." The scene this wrap evokes: your most important package tracking notification: "OUT FOR DELIVERY" — this is the truck bringing it. Avoid making it look like a moving company; avoid any visual clutter that suggests disorganization.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Food Truck: The vehicle wrap is the billboard, the menu, the brand, and the first bite — all in one. The design must trigger a Pavlovian appetite response from someone driving past at 35mph. The hero illustration should be the FOOD ITSELF — a massive, beautifully rendered illustration of the signature dish (a steaming bowl of ramen, a towering smash burger with melting cheese, a perfectly folded street taco with visible toppings) at near-photorealistic craft illustration quality, filling the door panel like a magazine food photography spread. Steam swirl graphics (thick, gracefully curved parallel lines that rise and dissipate) come off the food illustration and flow upward across the truck side. Typography is BIG and built on contrast: the business name in 8–12 inch hand-lettered or bold display type, warm cream or bright white on a deep red or charcoal ground. Real-world references: Kogi BBQ truck visual identity (the OG food truck brand), Danny Trejo's Tacos truck exterior, the visual world of Lucky Lee's or Superiority Burger — vivid, ingredient-confident, and personality-first. Color psychology: warm tomato red and mustard yellow are the colors food scientists call "appetite stimulants" — they literally increase hunger. Charcoal as the background gives depth and contrast, and cream/white type pops off it cleanly. The scene this wrap evokes: the moment you smell something incredible and turn to see where it's coming from — this truck is the answer. Avoid generic chef-hat clip art; avoid anything that looks like a catering uniform catalog.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — Real Estate: The vehicle for a real estate professional is essentially a moving business card — and like the best business cards, its power comes from restraint, quality of materials implied, and clarity of identity. The design should feel like it parks comfortably in the driveway of an $800K listing. The house/roof silhouette is used as a MINIMAL, elegant icon — think the thin-line architectural drawing aesthetic of a high-end home builder's logo, not a clip-art house. The key motif is rendered as a clean, modern key profile (think the shape of a Schlage or Yale residential key, not a cartoon skeleton key), used small as an accent badge or reversed out of an accent color block. Typography is the hero: the agent's name or company name in a sophisticated serif (Playfair Display, Cormorant Garamond, or a clean transitional serif) or a refined geometric sans (Optima, Raleway Thin), set large on a clean field with generous white space around it. Real-world references: Compass Real Estate fleet vehicle design system (the most design-forward real estate brand currently), Pacific Union International agent vehicle graphics, the kind of real estate vehicle that parks at a Sotheby's International listing and matches the neighborhood aesthetic. Color psychology: deep charcoal communicates authority and premium quality; warm cream communicates approachability and luxury warmth; a single accent (gold = established, teal = modern, burgundy = heritage) provides the brand differentiation. The scene this wrap evokes: arriving to show a property in a Range Rover neighborhood and fitting in perfectly. Avoid "FOR SALE" banner aesthetic, avoid stock-photo real estate clip art, avoid anything that looks like a Century 21 franchise sign from 1985.`,
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
    dnaFragment:
      `INDUSTRY BRIEF — General Business: Without a specific trade identity to anchor the design, the wrap must work harder through pure brand clarity and visual confidence. The logo and business name ARE the hero — place the logo large on the door panel (30–40% of door height) with nothing competing for attention within its immediate field. The wordmark should be the single most legible element on the vehicle at 20 yards. Choose a strong geometric accent element derived from the logo itself — if the logo has a circle, use circles as a repeating background motif; if it has a diagonal, echo that diagonal as a structural color block. The palette should be built from the logo's colors, expanded to include one light ground (white or cream) and one dark anchor (charcoal or navy). Real-world references: The design discipline of a well-executed B2B service company van — think the kind of vehicle that parks at a corporate campus and looks like it belongs there, the kind of fleet vehicle a serious franchise operation uses (ServiceMaster, ABM Industries). The scene this wrap evokes: professional arrival — a client opens their door and sees this truck and immediately thinks "these people have their act together." Avoid visual noise, avoid filling empty space with decoration for its own sake, and avoid making the design look like a template was applied without thought.`,
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
