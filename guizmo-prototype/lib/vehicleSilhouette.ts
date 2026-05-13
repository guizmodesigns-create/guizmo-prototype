// =========================================================================
// lib/vehicleSilhouette.ts
//
// Lightweight inline SVG silhouettes that change as the user fills in
// vehicle selection. Keeps a "your ride is taking shape" feel without
// shipping any external assets.
// =========================================================================

export type SilhouetteKind = 'truck' | 'van' | 'suv' | 'sedan' | 'generic';

const KEYWORDS: Array<{ kind: SilhouetteKind; words: string[] }> = [
  { kind: 'truck', words: ['silverado', 'f-150', 'f150', 'sierra', 'ram', 'tundra', 'tacoma', 'colorado', 'ranger', 'frontier', 'maverick', 'titan'] },
  { kind: 'van', words: ['sprinter', 'transit', 'promaster', 'savana', 'express', 'metris', 'nv200', 'caravan', 'sienna', 'odyssey', 'pacifica'] },
  { kind: 'suv', words: ['tahoe', 'suburban', 'expedition', 'yukon', 'escalade', 'navigator', 'highlander', 'pilot', 'explorer', '4runner', 'wrangler', 'cherokee', 'pathfinder', 'sequoia', 'durango', 'armada'] },
  { kind: 'sedan', words: ['camry', 'accord', 'civic', 'corolla', 'altima', 'sentra', 'sonata', 'elantra', 'fusion', 'malibu', 'impala', 'charger'] },
];

export function classifyVehicle(model: string): SilhouetteKind {
  const m = (model || '').toLowerCase();
  if (!m) return 'generic';
  for (const { kind, words } of KEYWORDS) {
    if (words.some((w) => m.includes(w))) return kind;
  }
  return 'generic';
}

export const SILHOUETTE_SVGS: Record<SilhouetteKind, string> = {
  truck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 60h180"/><path d="M20 60V40c0-4 3-7 7-7h60V18c0-3 2-5 5-5h35c3 0 6 2 7 5l10 20h35c4 0 6 3 6 7v15"/><circle cx="55" cy="62" r="9" fill="currentColor" fill-opacity=".15"/><circle cx="155" cy="62" r="9" fill="currentColor" fill-opacity=".15"/></svg>`,
  van: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 60h180"/><path d="M15 60V25c0-4 3-7 7-7h130c5 0 8 2 10 6l18 28v8"/><line x1="60" y1="20" x2="60" y2="50"/><line x1="105" y1="20" x2="105" y2="50"/><circle cx="50" cy="62" r="9" fill="currentColor" fill-opacity=".15"/><circle cx="155" cy="62" r="9" fill="currentColor" fill-opacity=".15"/></svg>`,
  suv: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 60h180"/><path d="M22 60V40c0-4 3-7 7-7l18-12c3-2 6-3 10-3h78c4 0 8 1 11 3l24 19c4 1 8 4 8 9v11"/><circle cx="55" cy="62" r="9" fill="currentColor" fill-opacity=".15"/><circle cx="150" cy="62" r="9" fill="currentColor" fill-opacity=".15"/></svg>`,
  sedan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 60h180"/><path d="M20 60V48c0-3 2-5 5-6l25-14c4-2 8-3 12-3h74c5 0 9 2 13 5l22 13c5 1 9 4 9 9v8"/><circle cx="55" cy="62" r="9" fill="currentColor" fill-opacity=".15"/><circle cx="150" cy="62" r="9" fill="currentColor" fill-opacity=".15"/></svg>`,
  generic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 6"><path d="M10 60h180"/><path d="M20 60V40c0-4 3-7 7-7h60V18c0-3 2-5 5-5h35c3 0 6 2 7 5l10 20h35c4 0 6 3 6 7v15"/><circle cx="55" cy="62" r="9"/><circle cx="155" cy="62" r="9"/></svg>`,
};
