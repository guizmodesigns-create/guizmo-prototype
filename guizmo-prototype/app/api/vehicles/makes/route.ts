import { NextResponse } from 'next/server';

// =========================================================================
// /api/vehicles/makes
// Returns a deduped, alphabetically sorted list of vehicle Makes from
// NHTSA's free vPIC API across car / truck / MPV vehicle types.
//
// Cached in-process for 24h. NHTSA is slow but reliable.
// =========================================================================

export const runtime = 'nodejs';
// Cache the response on the Vercel edge for 24h.
export const revalidate = 86400;

const TYPES = ['car', 'truck', 'mpv'];

let memo: { ts: number; data: string[] } | null = null;

export async function GET() {
  try {
    if (memo && Date.now() - memo.ts < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ makes: memo.data });
    }

    const results: Set<string> = new Set();

    await Promise.all(
      TYPES.map(async (type) => {
        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/${encodeURIComponent(type)}?format=json`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) return;
        const json = await res.json();
        const rows: Array<{ MakeName?: string; MakeId?: number }> = json?.Results ?? [];
        for (const r of rows) {
          if (r?.MakeName) results.add(toTitleCase(r.MakeName));
        }
      }),
    );

    // A handful of popular makes that are sometimes missed by NHTSA
    // categorisation — small belt-and-suspenders list.
    const fallback = [
      'Ford', 'Chevrolet', 'GMC', 'Ram', 'Dodge', 'Jeep',
      'Toyota', 'Honda', 'Nissan', 'Subaru', 'Mazda',
      'Hyundai', 'Kia', 'Volkswagen', 'BMW', 'Mercedes-Benz',
      'Audi', 'Lexus', 'Acura', 'Infiniti', 'Buick', 'Cadillac',
      'Chrysler', 'Lincoln', 'Mitsubishi', 'Volvo', 'Tesla',
      'Mini', 'Fiat', 'Porsche', 'Land Rover',
    ];
    for (const m of fallback) results.add(m);

    const list = Array.from(results)
      .filter((m) => m && m.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));

    memo = { ts: Date.now(), data: list };
    return NextResponse.json({ makes: list });
  } catch (err: any) {
    console.error('[vehicles/makes] error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown error', makes: [] },
      { status: 500 },
    );
  }
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (w === 'bmw' || w === 'gmc' || w === 'mg') return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ')
    .replace(/Mercedes-benz/i, 'Mercedes-Benz')
    .replace(/Land Rover/i, 'Land Rover');
}
