'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Vehicle } from '@/lib/types';
import { classifyVehicle, SILHOUETTE_SVGS } from '@/lib/vehicleSilhouette';

const YEARS = Array.from({ length: 2027 - 2010 + 1 }, (_, i) =>
  String(2027 - i),
);

// In-memory cache so the wizard doesn't re-hit /api on back-navigation.
const makesCache: { data: string[] | null } = { data: null };
const modelsCache = new Map<string, string[]>();

export function Step1Vehicle({
  value,
  onChange,
  onNext,
}: {
  value: Vehicle;
  onChange: (v: Vehicle) => void;
  onNext: () => void;
}) {
  const [makes, setMakes] = useState<string[]>(makesCache.data ?? []);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(!makesCache.data);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!makesCache.data) {
      fetch('/api/vehicles/makes')
        .then((r) => r.json())
        .then((j) => {
          if (!alive) return;
          const list: string[] = j.makes ?? [];
          makesCache.data = list;
          setMakes(list);
        })
        .catch(() => setMakes([]))
        .finally(() => alive && setLoadingMakes(false));
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setModels([]);
    if (!value.year || !value.make) return;
    const key = `${value.make}::${value.year}`;
    const cached = modelsCache.get(key);
    if (cached) {
      setModels(cached);
      return;
    }
    setLoadingModels(true);
    fetch(
      `/api/vehicles/models?make=${encodeURIComponent(value.make)}&year=${encodeURIComponent(value.year)}`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const list: string[] = j.models ?? [];
        modelsCache.set(key, list);
        setModels(list);
      })
      .catch(() => setModels([]))
      .finally(() => alive && setLoadingModels(false));
    return () => {
      alive = false;
    };
  }, [value.year, value.make]);

  const silhouette = useMemo(() => {
    const kind = value.model ? classifyVehicle(value.model) : 'generic';
    return SILHOUETTE_SVGS[kind];
  }, [value.model]);

  const canContinue = !!value.year && !!value.make && !!value.model;

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-orange-400">
          Step 1 — Vehicle
        </div>
        <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
          Pick your <span className="text-orange-400">weapon.</span>
        </h2>
        <p className="mt-3 text-ink-200">
          We design the wrap to fit your exact ride — proportions matter. Pick
          the year, make, and model. Trim is optional.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="gz-label">Year</label>
            <select
              className="gz-input"
              value={value.year}
              onChange={(e) =>
                onChange({ ...value, year: e.target.value, model: '' })
              }
            >
              <option value="">Select year…</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="gz-label">Make</label>
            <select
              className="gz-input"
              disabled={!value.year || loadingMakes}
              value={value.make}
              onChange={(e) =>
                onChange({ ...value, make: e.target.value, model: '' })
              }
            >
              <option value="">
                {loadingMakes ? 'Loading makes…' : 'Select make…'}
              </option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="gz-label">Model</label>
            <select
              className="gz-input"
              disabled={!value.make || loadingModels}
              value={value.model}
              onChange={(e) => onChange({ ...value, model: e.target.value })}
            >
              <option value="">
                {loadingModels
                  ? 'Loading models…'
                  : !value.make
                  ? 'Pick a make first'
                  : models.length === 0
                  ? 'No models found — try another year'
                  : 'Select model…'}
              </option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="gz-label">
              Trim{' '}
              <span className="font-normal normal-case tracking-normal text-ink-400">
                (optional)
              </span>
            </label>
            <input
              type="text"
              className="gz-input"
              placeholder="e.g. XLT, Limited, Sport — leave blank if unsure"
              value={value.trim ?? ''}
              onChange={(e) => onChange({ ...value, trim: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end">
          <button
            type="button"
            disabled={!canContinue}
            onClick={onNext}
            className="btn-primary"
          >
            Continue →
          </button>
        </div>
      </div>

      <div className="md:sticky md:top-6 md:self-start">
        <div className="gz-card p-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
            Your Ride
          </div>
          <div className="mt-2 font-display text-xl font-bold text-white">
            {value.year || '—'} {value.make || ''} {value.model || ''}{' '}
            <span className="text-ink-300 font-medium">{value.trim ?? ''}</span>
          </div>
          <div
            className="mt-6 flex h-40 items-center justify-center text-orange-400"
            dangerouslySetInnerHTML={{ __html: silhouette }}
          />
          <div className="mt-4 text-xs text-ink-300">
            Silhouette is illustrative — your final mockup uses the exact
            year/make/model proportions.
          </div>
        </div>
      </div>
    </div>
  );
}
