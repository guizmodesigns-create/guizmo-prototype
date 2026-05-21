'use client';

import React from 'react';
import type { VibeKey } from '@/lib/types';

const VIBES: Array<{
  key: VibeKey;
  title: string;
  description: string;
  swatch: string[]; // CSS gradient stops
}> = [
  {
    key: 'bold-loud',
    title: 'Bold & Loud',
    description: 'Sweeping diagonals, oversized graphics, can be seen from a block away.',
    swatch: ['#FF5A0A', '#FFD000', '#0F1320'],
  },
  {
    key: 'clean-professional',
    title: 'Clean & Professional',
    description: 'Restrained layout, balanced negative space, the truck a CFO would hire.',
    swatch: ['#1A2A66', '#FFFFFF', '#E5E7EB'],
  },
  {
    key: 'rugged-industrial',
    title: 'Rugged & Industrial',
    description: 'Stencil graphics, distressed textures, slab type. No-nonsense.',
    swatch: ['#3B4A5A', '#F2C200', '#1A1A1A'],
  },
  {
    key: 'playful-friendly',
    title: 'Playful & Friendly',
    description: 'Rounded shapes, bright saturated colors, approachable energy.',
    swatch: ['#3DBE8B', '#FFD000', '#5BC0EB'],
  },
];

export function Step3Style({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: VibeKey | '';
  onChange: (v: VibeKey) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-orange-400">
        Step 3 — Style
      </div>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
        What energy are you <span className="text-orange-400">going for?</span>
      </h2>
      <p className="mt-3 max-w-2xl text-ink-200">
        Pick one. We'll mix it with your industry to nail the look.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {VIBES.map((v) => {
          const active = value === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => onChange(v.key)}
              data-active={active}
              className="choice-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-xl font-black text-white">
                    {v.title}
                  </div>
                  <div className="mt-2 text-sm text-ink-200">{v.description}</div>
                </div>
                <div
                  className="h-16 w-24 shrink-0 rounded-lg border border-ink-600/50"
                  style={{
                    background: `linear-gradient(135deg, ${v.swatch.join(', ')})`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn-ghost">
          ← Back
        </button>
        <button
          type="button"
          disabled={!value}
          onClick={onNext}
          className="btn-primary"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
