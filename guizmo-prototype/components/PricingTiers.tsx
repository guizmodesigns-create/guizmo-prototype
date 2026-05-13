'use client';

import React from 'react';

export interface PricingTier {
  key: 'decals' | 'partial' | 'full';
  label: string;
  description: string;
  startingPrice: string;
  financing: string;
  highlight?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    key: 'decals',
    label: 'Decals & Lettering',
    description: 'Logo, business info, and accent stripes. Maximum value entry point.',
    startingPrice: 'Starting at $1,200',
    financing: 'as low as $55/mo',
  },
  {
    key: 'partial',
    label: 'Partial Wrap',
    description: 'Sides, rear, key panels. Big impact, less material.',
    startingPrice: 'Starting at $3,800',
    financing: 'as low as $175/mo',
    highlight: true,
  },
  {
    key: 'full',
    label: 'Full Wrap',
    description: 'Complete coverage, every panel. Maximum billboard.',
    startingPrice: 'Starting at $7,500',
    financing: 'as low as $345/mo',
  },
];

export function PricingTiers({
  onChoose,
}: {
  onChoose: (tier: PricingTier) => void;
}) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-orange-400">
        Pricing
      </div>
      <h3 className="mt-2 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
        Pick how big you want to go.
      </h3>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {PRICING_TIERS.map((t) => (
          <div
            key={t.key}
            className={[
              'gz-card relative flex flex-col p-6',
              t.highlight ? 'ring-2 ring-orange-500/60' : '',
            ].join(' ')}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-6 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ink-950">
                Most popular
              </div>
            )}
            <div className="font-display text-xl font-bold text-white">
              {t.label}
            </div>
            <p className="mt-2 text-sm text-ink-200">{t.description}</p>

            <div className="mt-5">
              <div className="font-display text-2xl font-black text-orange-400">
                {t.startingPrice}
              </div>
              <div className="text-xs text-ink-300">{t.financing}</div>
            </div>

            <button
              type="button"
              onClick={() => onChoose(t)}
              className="btn-primary mt-6 w-full"
            >
              Start with this
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-400">
        Final price depends on vehicle size, coverage complexity, and design
        revisions. Quote confirms before we cut vinyl.
      </p>
    </div>
  );
}
