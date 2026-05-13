// =========================================================================
// lib/processLogo.ts
// Accepts PNG / JPG / SVG buffers, normalizes them to a clean PNG
// (max 1024px on longest edge, with transparent background where possible).
// =========================================================================
//
// PIPELINE:
//   - SVG  → rasterize to high-res PNG via @resvg/resvg-js, then sharp resize
//   - PNG  → sharp resize (kept transparent if it already is)
//   - JPG  → sharp resize. JPG is opaque so the background remains in the image.
//
// KNOWN LIMITATION:
//   Automatic background removal is NOT performed. The npm libraries that do
//   this client-side (e.g. @imgly/background-removal-node) ship a 30–80 MB
//   ONNX model and add several seconds of cold-start on Vercel — not worth
//   it for a prototype.
//
//   For best results we tell users (in the intake form) to upload a
//   transparent PNG. JPGs with a solid white background still work
//   reasonably well because Gemini and the sharp composite step both
//   tolerate the white edges.
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

export async function processLogo(
  inputBuffer: Buffer,
  mimeType: string,
): Promise<ProcessedLogo> {
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
  } else {
    // PNG or JPG → just feed to sharp.
    pngBuffer = inputBuffer;
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
