import { NextResponse } from 'next/server';
import sharp from 'sharp';

// =========================================================================
// /api/fetch-logo
// POST { url: "https://example.com" }
// → { dataUrl: "data:image/png;base64,..." , sourceUrl: string, strategy: string }
//
// Tries, in order:
//   1. og:image meta tag
//   2. apple-touch-icon
//   3. <link rel="icon"> / favicon
//   4. <img> tags whose src or alt contains "logo"
//
// Returns the FIRST candidate that successfully loads + decodes as an
// image. Normalizes the result to a max-1024px-edge PNG.
// =========================================================================

export const runtime = 'nodejs';
export const maxDuration = 20;

const USER_AGENT =
  'Mozilla/5.0 (compatible; GuizmoLogoFetcher/1.0; +https://charlottevehiclewraps.com)';
const MAX_EDGE = 1024;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB cap on fetched images

interface Candidate {
  url: string;
  strategy: string;
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

  // 2. apple-touch-icon (often higher quality than favicon)
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
    if (/apple-touch-icon/i.test(tag)) continue; // already handled
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      const abs = absoluteUrl(baseUrl, href);
      if (abs) out.push({ url: abs, strategy: 'favicon' });
    }
  }

  // 4. <img> tags containing "logo"
  const imgMatches = [...html.matchAll(/<img[^>]*>/gi)];
  for (const m of imgMatches) {
    const tag = m[0];
    if (!/logo/i.test(tag)) continue;
    const src = tag.match(/src=["']([^"']+)["']/i)?.[1];
    if (src) {
      const abs = absoluteUrl(baseUrl, src);
      if (abs) out.push({ url: abs, strategy: 'header-img-logo' });
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
      // 12s timeout per candidate
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    // Reject obvious HTML pages.
    if (ct.includes('text/html')) return null;

    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_BYTES) return null;
    const buf = Buffer.from(ab);

    // .ico files: try sharp; if it fails, return raw (sharp supports many
    // PNG-encoded ICOs but not all).
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
      // Skip tiny images (< 32px) — likely junk favicons.
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

    for (const c of candidates) {
      const got = await fetchAndNormalize(c.url);
      if (got) {
        const dataUrl =
          'data:image/png;base64,' + got.buffer.toString('base64');
        return NextResponse.json({
          ok: true,
          dataUrl,
          sourceUrl: c.url,
          strategy: c.strategy,
          width: got.width,
          height: got.height,
        });
      }
    }

    return NextResponse.json(
      {
        error:
          "We found some images but couldn't load a usable logo. Try uploading one directly.",
      },
      { status: 404 },
    );
  } catch (err: any) {
    console.error('[fetch-logo] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error.' },
      { status: 500 },
    );
  }
}
