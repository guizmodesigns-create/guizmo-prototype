// =========================================================================
// lib/types.ts — Shared types for the v3 Wrapmate-style flow.
// =========================================================================

export type IndustryKey =
  | 'construction'
  | 'plumbing'
  | 'hvac'
  | 'electrical'
  | 'landscaping'
  | 'roofing'
  | 'cleaning'
  | 'mobile-services'
  | 'delivery'
  | 'food-truck'
  | 'real-estate'
  | 'other';

export type VibeKey =
  | 'bold-loud'
  | 'clean-professional'
  | 'rugged-industrial'
  | 'playful-friendly';

export type CoverageKey = 'full' | 'partial' | 'decals';

export interface Vehicle {
  year: string;
  make: string;
  model: string;
  trim?: string;
}

export interface BrandFields {
  /** Toggle states */
  showBusinessName: boolean;
  showTagline: boolean;
  showWebsite: boolean;
  showPhone: boolean;
  /** Values when toggles are on */
  businessName: string;
  tagline: string;
  website: string;
  phone: string;
}

export interface ColorPrefs {
  surpriseMe: boolean;
  primary: string;
  secondary: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

export interface LogoInfo {
  /** "upload" or "url" */
  source: 'upload' | 'url' | 'none';
  fileName?: string;
  fetchedUrl?: string;
  /** Data URL of the processed PNG (kept client-side only). */
  dataUrl?: string;
}

export interface Intake {
  vehicle: Vehicle;
  industry: IndustryKey;
  industryOther?: string;
  vibe: VibeKey;
  brand: BrandFields;
  colors: ColorPrefs;
  coverage: CoverageKey;
  logo: LogoInfo;
  contact: ContactInfo;
}

export interface DesignBrief {
  palette: {
    name: string;
    colors: { name: string; hex: string; usage: string }[];
  };
  layout: string;
  typography: string;
  keyElements: string[];
  rationale: string;
}

export interface ConceptResult {
  id: string;
  label: string;
  imageDataUrl: string;
  promptUsed?: string;
  /** Lightweight variation tag used when regenerating. */
  variation: 'front-heavy' | 'side-panel' | 'full-coverage' | 'accent-heavy';
  /** Optional follow-up tweak text that produced this concept. */
  tweakNote?: string;
}
