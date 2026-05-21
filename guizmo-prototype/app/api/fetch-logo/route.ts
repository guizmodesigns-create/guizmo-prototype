import { NextResponse } from 'next/server';
import sharp from 'sharp';

// =========================================================================
// /api/fetch-logo  (v3.1 — scoring system)
// POST { url: "https://example.com" }
// → { dataUrl, sourceUrl, strategy, score, width, height }
//
// Candidates are now SCORED instead of "first match wins":
//   - Size (bigger = better, max 100pts for >400px)
//   - Aspect ratio (banner 2:1–5:1 = +50, square = +20, extreme = -50)
//   - URL keywords ("logo" in URL = +30, "favicon"/"icon" = +5)
//   - Strategy source (img-tag=+40, og:image=+30, apple-touch-icon=+15, favicon=+5)
//   - Brightness/transparency (white-on-transparent or pure white = -100)
//
// Returns the HIGHEST-SCORING candidate, not the first.
// =========================================================================

export const runtime = 'nodejs';
export const maxDuration = 30;

const USER_AGENT =
  'Mozilla/5.0 (compatible; GuizmoLogoFetcher/1.1; +https://charlottevehiclewraps.com)';
const MAX_EDGE = 1024;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB cap on fetched images

interface Candidate {
  url: string;
  strategy: string;
}

interface ScoredCandidate {
  url: string;
  strategy: string;
  score: number;
  buffer: Buffer;
  width: number;
  height: number;
}

function absoluteUrl(baseUrl: string, maybeRelative: string): string | null {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

function findCandidates(html: string, baseUrl: string): Candidate[] {
  const out: Candidate[] = [];

  // 1. og:image
  const og = html.match(
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) {
    const abs = absoluteUrl(baseUrl, og[1]);
    if (abs) out.push({ url: abs, strategy: 'og:image' });
  }
  // og:image with content/property swapped
  const og2 = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  );
  if (og2?.[1]) {
    const abs = absoluteUrl(baseUrl, og2[1]);
    if (abs) out.push({ url: abs, strategy: 'og:image' });
  }

  // 2. apple-touch-icon
  const appleMatches = [
    ...html.matchAll(
      /<link[^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["'][^>]*>/gi,
    ),
  ];
  for (const m of appleMatches) {
    const tag = m[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      const abs = absoluteUrl(baseUrl, href);
      if (abs) out.push({ url: abs, strategy: 'apple-touch-icon' });
    }
  }

  // 3. <link rel="icon"> / shortcut icon
  const iconMatches = [
    ...html.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi),
  ];
  for (const m of iconMatches) {
    const tag = m[0];
    if (/apple-touch-icon/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      const abs = absoluteUrl(baseUrl, href);
      if (abs) out.push({ url: abs, strategy: 'favicon' });
    }
  }

  // 4. <img> tags containing "logo" in src, alt, class, or id
  const imgMatches = [...html.matchAll(/<img[^>]*>/gi)];
  for (const m of imgMatches) {
    const tag = m[0];
    if (!/logo/i.test(tag)) continue;
    const src = tag.match(/src=["']([^"']+)["']/i)?.[1];
    if (src) {
      const abs = absoluteUrl(baseUrl, src);
      if (abs) out.push({ url: abs, strategy: 'img-tag' });
    }
  }

  // 5. Fallback: /favicon.ico
  try {
    const u = new URL(baseUrl);
    out.push({ url: `${u.protocol}//${u.host}/favicon.ico`, strategy: 'favicon-default' });
  } catch {
    /* noop */
  }

  // Dedupe while preserving order.
  const seen = new Set<string>();
  return out.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

async function fetchAndNormalize(
  url: string,
): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'image/*,*/*;q=0.8' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('text/html')) return null;

    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_BYTES) return null;
    const buf = Buffer.from(ab);

    try {
      const png = await sharp(buf, { failOn: 'none' })
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ compressionLevel: 9 })
        .toBuffer({ resolveWithObject: true });
      if ((png.info.width ?? 0) < 32 || (png.info.height ?? 0) < 32) return null;
      return {
        buffer: png.data,
        width: png.info.width,
        height: png.info.height,
      };
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Brightness/transparency analysis.
 * Samples center pixels of the image. Returns true if the image is
 * "mostly white on transparent" or "pure white" — these are header logos
 * that render invisible on light vehicle wraps.
 */
async function isLikelyWhiteOrTransparent(buffer: Buffer): Promise<boolean> {
  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    const w = meta.width ?? 64;
    const h = meta.height ?? 64;

    // Sample a 32×32 center crop (or smaller if image is tiny)
    const sampleW = Math.min(32, w);
    const sampleH = Math.min(32, h);
    const left = Math.floor((w - sampleW) / 2);
    const top = Math.floor((h - sampleH) / 2);

    const { data } = await sharp(buffer)
      .extract({ left, top, width: sampleW, height: sampleH })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelCount = sampleW * sampleH;
    let nearWhiteOrTransparent = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      // Transparent pixel
      if (a < 30) {
        nearWhiteOrTransparent++;
        continue;
      }
      // Near-white pixel (white logo on transparent — looks white when composited)
      if (r > 240 && g > 240 && b > 240) {
        nearWhiteOrTransparent++;
      }
    }

    const ratio = nearWhiteOrTransparent / pixelCount;
    // If >80% of center pixels are white or transparent, reject
    return ratio > 0.80;
  } catch {
    return false;
  }
}

function scoreUrl(url: string): number {
  let s = 0;
  const lower = url.toLowerCase();
  if (/logo/i.test(lower)) s += 30;
  if (/favicon|icon/.test(lower)) s += 5;
  return s;
}

function scoreStrategy(strategy: string): number {
  switch (strategy) {
    case 'img-tag': return 40;
    case 'og:image': return 30;
    case 'apple-touch-icon': return 15;
    case 'favicon': return 5;
    case 'favicon-default': return 3;
    default: return 10;
  }
}

function scoreSize(w: number, h: number): number {
  const maxDim = Math.max(w, h);
  if (maxDim >= 400) return 100;
  if (maxDim >= 200) return 60;
  if (maxDim >= 100) return 30;
  return 0;
}

function scoreAspectRatio(w: number, h: number): number {
  if (w === 0 || h === 0) return 0;
  const ratio = w / h;
  // Banner-style logo (wide): 2:1 to 5:1
  if (ratio >= 2.0 && ratio <= 5.0) return 50;
  // Square / near-square: 0.75:1 to 1.5:1
  if (ratio >= 0.75 && ratio <= 1.5) return 20;
  // Extreme aspect ratio (very wide strip or very tall): penalise
  if (ratio > 8 || ratio < 0.2) return -50;
  return 0;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    let target = (body.url ?? '').trim();
    if (!target) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(target)) {
      target = 'https://' + target;
    }
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs are allowed.' }, { status: 400 });
    }

    // Fetch the HTML.
    let html = '';
    try {
      const res = await fetch(target, {
        headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
        signal: AbortSignal.timeout(12_000),
        redirect: 'follow',
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Site returned ${res.status}.` },
          { status: 502 },
        );
      }
      html = await res.text();
    } catch (err: any) {
      return NextResponse.json(
        { error: `Couldn't reach that site: ${err?.message ?? err}` },
        { status: 502 },
      );
    }

    const candidates = findCandidates(html, target);
    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'No logo candidates found on that page.' },
        { status: 404 },
      );
    }

    // Fetch all candidates and score them
    const scored: ScoredCandidate[] = [];

    await Promise.all(
      candidates.map(async (c) => {
        const got = await fetchAndNormalize(c.url);
        if (!got) return;

        // Brightness/transparency penalty
        const isBadWhite = await isLikelyWhiteOrTransparent(got.buffer);

        let score = 0;
        score += scoreUrl(c.url);
        score += scoreStrategy(c.strategy);
        score += scoreSize(got.width, got.height);
        score += scoreAspectRatio(got.width, got.height);
        if (isBadWhite) score -= 100;

        scored.push({
          url: c.url,
          strategy: c.strategy,
          score,
          buffer: got.buffer,
          width: got.width,
          height: got.height,
        });
      }),
    );

    if (scored.length === 0) {
      return NextResponse.json(
        {
          error:
            "We found some images but couldn't load a usable logo. Try uploading one directly.",
        },
        { status: 404 },
      );
    }

    // Pick the highest-scoring candidate
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    const dataUrl = 'data:image/png;base64,' + best.buffer.toString('base64');
    return NextResponse.json({
      ok: true,
      dataUrl,
      sourceUrl: best.url,
      strategy: best.strategy,
      score: best.score,
      width: best.width,
      height: best.height,
    });
  } catch (err: any) {
    console.error('[fetch-logo] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error.' },
      { status: 500 },
    );
  }
}
