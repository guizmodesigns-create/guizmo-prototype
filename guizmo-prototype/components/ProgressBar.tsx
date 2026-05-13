'use client';

import React from 'react';

const STEP_LABELS = [
  'VEHICLE',
  'INDUSTRY',
  'STYLE',
  'BRAND',
  'INSPIRATION',
  'CONTACT',
  'DESIGNS',
];

export function ProgressBar({
  step,
  onStepClick,
}: {
  step: number; // 1..7
  onStepClick?: (n: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, ((step - 1) / 6) * 100));
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-widest text-orange-400">
          Step {step} of 7
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-ink-300">
          {STEP_LABELS[step - 1] ?? ''}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Progress dots */}
      <div className="mt-3 flex items-center justify-between gap-1">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const isDone = n < step;
          const isCurrent = n === step;
          const clickable = !!onStepClick && n < step;
          return (
            <button
              key={label}
              type="button"
              title={label}
              onClick={clickable ? () => onStepClick!(n) : undefined}
              disabled={!clickable}
              className={[
                'flex flex-col items-center gap-1.5 transition',
                clickable ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              {/* Dot */}
              <span
                className={[
                  'block h-2.5 w-2.5 rounded-full border-2 transition-all duration-300',
                  isDone
                    ? 'border-orange-500 bg-orange-500'
                    : isCurrent
                    ? 'border-white bg-transparent scale-125'
                    : 'border-ink-500 bg-transparent',
                ].join(' ')}
              />
              {/* Label — hidden on mobile, shown md+ */}
              <span
                className={[
                  'hidden text-[9px] font-black uppercase tracking-widest md:block',
                  isCurrent
                    ? 'text-orange-300'
                    : isDone
                    ? 'text-ink-300'
                    : 'text-ink-500',
                ].join(' ')}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
