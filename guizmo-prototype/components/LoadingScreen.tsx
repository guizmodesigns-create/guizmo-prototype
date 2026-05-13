'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  'Interpreting your vibe…',
  'Pulling industry references…',
  'Designing four concepts…',
  'Mapping graphics to your ride…',
  'Rendering previews…',
];

export function LoadingScreen({
  vehicleLabel,
  done,
}: {
  vehicleLabel: string;
  done: boolean;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (done) {
      setActive(STEPS.length - 1);
      return;
    }
    const interval = setInterval(() => {
      setActive((i) => Math.min(STEPS.length - 2, i + 1));
    }, 4200);
    return () => clearInterval(interval);
  }, [done]);

  const steps = STEPS.map((s, i) =>
    i === 3 ? `Mapping graphics to your ${vehicleLabel}…` : s,
  );

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="dot-pulse mx-auto justify-center">
        <span />
        <span />
        <span />
      </div>
      <h2 className="mt-6 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
        Cooking up your <span className="text-orange-400">four concepts.</span>
      </h2>
      <p className="mt-2 text-ink-200">
        Takes about 30–60 seconds. Don't close the tab.
      </p>

      <ul className="mx-auto mt-10 space-y-3 text-left">
        <AnimatePresence initial={false}>
          {steps.map((label, i) => {
            const state =
              i < active ? 'done' : i === active ? 'active' : 'pending';
            if (state === 'pending') return null;
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-lg border border-ink-600/40 bg-ink-900/40 px-4 py-3"
              >
                <span
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black',
                    state === 'done'
                      ? 'border-orange-500/0 bg-orange-500 text-ink-950'
                      : 'border-orange-400/80 text-orange-300',
                  ].join(' ')}
                >
                  {state === 'done' ? '✓' : i + 1}
                </span>
                <span
                  className={[
                    'text-sm',
                    state === 'done' ? 'text-ink-200' : 'text-white font-semibold',
                  ].join(' ')}
                >
                  {label}
                </span>
                {state === 'active' && (
                  <span className="ml-auto text-xs text-orange-300">
                    Working…
                  </span>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
