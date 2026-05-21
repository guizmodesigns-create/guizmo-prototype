// =========================================================================
// lib/processLogo.ts
// Accepts PNG / JPG / SVG buffers, normalizes them to a clean PNG
// (max 1024px on longest edge, with transparent background where possible).
// =========================================================================
//
// PIPELINE:
//   - SVG  → rasterize to high-res PNG via @resvg/resvg-js, then sharp resize
//   - PNG  → white-background knockout (optional, default true) + sharp resize
//   - JPG  → white-background knockout (optional, default true) + sharp resize
//
// WHITE BACKGROUND KNOCKOUT:
//   For each pixel where R, G, B are all > 245 (near-white), alpha is set to 0.
//   This prevents white-background logos from appearing as white boxes on
//   light-colored vehicle wraps.
// =========================================================================

import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

export interface ProcessedLogo {
  pngBuffer: Buffer;
  width: number;
  height: number;
  mimeType: 'image/png';
}

const MAX_EDGE = 1024;

/**
 * Removes near-white pixels by setting their alpha to 0.
 * Uses Sharp's raw pixel access for per-pixel editing.
 * @param pngBuffer  PNG buffer (any size, must have been decoded to PNG)
 * @returns new PNG buffer with near-white pixels made transparent
 */
export async function removeWhiteBackground(pngBuffer: Buffer): Promise<Buffer> {
  const img = sharp(pngBuffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  if (channels < 4) {
    // Should not happen after ensureAlpha, but guard anyway.
    return pngBuffer;
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Near-white: all channels > 245
    if (r > 245 && g > 245 && b > 245) {
      data[i + 3] = 0; // set alpha to 0
    }
  }

  return sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export async function processLogo(
  inputBuffer: Buffer,
  mimeType: string,
  options: { removeWhiteBg?: boolean } = {},
): Promise<ProcessedLogo> {
  const removeWhiteBg = options.removeWhiteBg ?? true;
  let pngBuffer: Buffer;

  const mt = (mimeType || '').toLowerCase();

  if (mt.includes('svg') || looksLikeSvg(inputBuffer)) {
    // SVG → rasterize at high resolution. resvg sizes by fitTo: { mode: 'width' }
    const resvg = new Resvg(inputBuffer, {
      fitTo: { mode: 'width', value: MAX_EDGE },
      background: 'rgba(0, 0, 0, 0)', // transparent
      font: { loadSystemFonts: false }, // faster + deterministic
    });
    const rendered = resvg.render();
    pngBuffer = rendered.asPng();
    // SVGs are already transparent — skip white knockout
  } else {
    // PNG or JPG → feed to sharp, then optionally knock out white bg.
    pngBuffer = inputBuffer;
    if (removeWhiteBg) {
      try {
        // Convert to PNG first so we have consistent pixel data
        const asPng = await sharp(pngBuffer)
          .png({ compressionLevel: 1 })
          .toBuffer();
        pngBuffer = await removeWhiteBackground(asPng);
      } catch (err) {
        console.warn('[processLogo] white background removal failed:', err);
        // Fall through with original buffer
      }
    }
  }

  // Resize so longest edge <= MAX_EDGE, output PNG with alpha.
  const resized = await sharp(pngBuffer)
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const meta = await sharp(resized).metadata();

  return {
    pngBuffer: resized,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    mimeType: 'image/png',
  };
}

function looksLikeSvg(buf: Buffer): boolean {
  const head = buf.slice(0, 256).toString('utf8').trim().toLowerCase();
  return head.startsWith('<?xml') || head.startsWith('<svg');
}

// =========================================================================
// compositeLogoOnMockup()
// Pastes the customer's original clean logo on top of the AI-generated
// vehicle mockup. This is the "insurance" step that guarantees logo
// fidelity even if Gemini slightly distorts the reference image.
//
// HOW TO TUNE PLACEMENT:
//   - SIDE_LOGO_HEIGHT_RATIO: fraction of mockup height the side logo
//     should occupy. 0.35 is a sensible default for a side-profile van.
//   - SIDE_LOGO_CENTER_X_RATIO / SIDE_LOGO_CENTER_Y_RATIO: where the
//     centre of the side-panel logo lives. (0.5, 0.55) ≈ middle-side.
//   - HOOD_LOGO_ENABLED: set to true to ALSO paste a smaller logo near
//     the hood/front. Off by default because the AI usually shows mostly
//     side-profile.
// =========================================================================

export interface CompositeOptions {
  /** Render a smaller secondary logo near the hood/front. */
  hoodLogoEnabled?: boolean;
  /** Side-logo height as fraction of mockup height. Default 0.35. */
  sideLogoHeightRatio?: number;
  /** Side-logo X centre, fraction of mockup width. Default 0.50. */
  sideLogoCenterXRatio?: number;
  /** Side-logo Y centre, fraction of mockup height. Default 0.55. */
  sideLogoCenterYRatio?: number;
}

export async function compositeLogoOnMockup(
  mockupBuffer: Buffer,
  logoBuffer: Buffer,
  opts: CompositeOptions = {},
): Promise<Buffer> {
  const hoodLogoEnabled = opts.hoodLogoEnabled ?? false;
  const sideLogoHeightRatio = opts.sideLogoHeightRatio ?? 0.35;
  const sideLogoCenterXRatio = opts.sideLogoCenterXRatio ?? 0.5;
  const sideLogoCenterYRatio = opts.sideLogoCenterYRatio ?? 0.55;

  const mockup = sharp(mockupBuffer);
  const meta = await mockup.metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  // ---- Side logo ----
  const sideH = Math.round(H * sideLogoHeightRatio);
  const sideLogoResized = await sharp(logoBuffer)
    .resize({ height: sideH, fit: 'inside' })
    .png()
    .toBuffer();
  const sideLogoMeta = await sharp(sideLogoResized).metadata();
  const sideW = sideLogoMeta.width ?? sideH;

  const sideLeft = Math.max(
    0,
    Math.round(W * sideLogoCenterXRatio - sideW / 2),
  );
  const sideTop = Math.max(
    0,
    Math.round(H * sideLogoCenterYRatio - (sideLogoMeta.height ?? sideH) / 2),
  );

  const composites: sharp.OverlayOptions[] = [
    { input: sideLogoResized, left: sideLeft, top: sideTop },
  ];

  // ---- Optional hood logo ----
  if (hoodLogoEnabled) {
    const hoodH = Math.round(H * 0.12);
    const hoodLogoResized = await sharp(logoBuffer)
      .resize({ height: hoodH, fit: 'inside' })
      .png()
      .toBuffer();
    const hoodMeta = await sharp(hoodLogoResized).metadata();
    const hoodW = hoodMeta.width ?? hoodH;
    composites.push({
      input: hoodLogoResized,
      left: Math.round(W * 0.85 - hoodW / 2),
      top: Math.round(H * 0.32 - (hoodMeta.height ?? hoodH) / 2),
    });
  }

  return mockup.composite(composites).png().toBuffer();
}
