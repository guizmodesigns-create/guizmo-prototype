import { NextResponse } from 'next/server';

// =========================================================================
// /api/vehicles/models?make=Ford&year=2024
// =========================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const memo = new Map<string, { ts: number; data: string[] }>();
const TTL = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const make = (url.searchParams.get('make') ?? '').trim();
    const year = (url.searchParams.get('year') ?? '').trim();

    if (!make || !year) {
      return NextResponse.json(
        { error: 'make and year are required query params', models: [] },
        { status: 400 },
      );
    }

    const cacheKey = `${make.toLowerCase()}::${year}`;
    const cached = memo.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json({ models: cached.data });
    }

    const nhtsa = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`;
    const res = await fetch(nhtsa, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `NHTSA returned ${res.status}`, models: [] },
        { status: 502 },
      );
    }
    const json = await res.json();
    const rows: Array<{ Model_Name?: string }> = json?.Results ?? [];
    const list = Array.from(
      new Set(rows.map((r) => (r.Model_Name ?? '').trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    memo.set(cacheKey, { ts: Date.now(), data: list });
    return NextResponse.json({ models: list });
  } catch (err: any) {
    console.error('[vehicles/models] error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown error', models: [] },
      { status: 500 },
    );
  }
}
