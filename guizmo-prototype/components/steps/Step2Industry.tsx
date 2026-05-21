'use client';

import React from 'react';
import type { IndustryKey } from '@/lib/types';
import { INDUSTRY_PROMPTS } from '@/lib/industryPrompts';

const ORDER: IndustryKey[] = [
  'construction',
  'plumbing',
  'hvac',
  'electrical',
  'landscaping',
  'roofing',
  'cleaning',
  'mobile-services',
  'delivery',
  'food-truck',
  'real-estate',
  'other',
];

export function Step2Industry({
  value,
  otherValue,
  onChange,
  onOtherChange,
  onNext,
  onBack,
}: {
  value: IndustryKey | '';
  otherValue: string;
  onChange: (v: IndustryKey) => void;
  onOtherChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const canContinue = !!value && (value !== 'other' || otherValue.trim().length > 0);

  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-orange-400">
        Step 2 — Industry
      </div>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
        What do you <span className="text-orange-400">do?</span>
      </h2>
      <p className="mt-3 max-w-2xl text-ink-200">
        This is the single biggest lever on the look of your wrap. Pick the
        closest fit — we'll design with the right motifs, colors, and energy for
        your trade.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ORDER.map((key) => {
          const i = INDUSTRY_PROMPTS[key];
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              data-active={active}
              className="choice-card flex flex-col items-start gap-2"
            >
              <div className="text-3xl">{i.icon}</div>
              <div className="font-display text-base font-bold text-white">
                {i.label}
              </div>
              <div className="text-xs text-ink-300">{i.headline}</div>
            </button>
          );
        })}
      </div>

      {value === 'other' && (
        <div className="mt-6">
          <label className="gz-label">Tell us what you do</label>
          <input
            type="text"
            className="gz-input max-w-xl"
            placeholder="e.g. Pet grooming, pressure washing, IT services…"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
          />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn-ghost">
          ← Back
        </button>
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
  );
}
