'use client';

import React from 'react';

const STEP_LABELS = [
  'VEHICLE',
  'INDUSTRY',
  'STYLE',
  'BRAND',
  'CONTACT',
  'DESIGNS',
];

export function ProgressBar({
  step,
  onStepClick,
}: {
  step: number; // 1..6
  onStepClick?: (n: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, ((step - 1) / 5) * 100));
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-widest text-orange-400">
          Step {step} of 6
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-ink-300">
          {STEP_LABELS[step - 1]}
        </div>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 hidden grid-cols-6 gap-2 md:grid">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const isDone = n < step;
          const isCurrent = n === step;
          const clickable = !!onStepClick && n < step;
          return (
            <button
              key={label}
              type="button"
              onClick={clickable ? () => onStepClick!(n) : undefined}
              disabled={!clickable}
              className={[
                'step-pill rounded-md py-1.5 text-center transition',
                isCurrent
                  ? 'bg-orange-500/15 text-orange-300 border border-orange-500/40'
                  : isDone
                  ? 'text-ink-200 hover:text-white cursor-pointer'
                  : 'text-ink-400/60',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
