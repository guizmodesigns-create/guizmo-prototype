'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ConceptResult, Intake } from '@/lib/types';
import { PRICING_TIERS, PricingTiers, type PricingTier } from '@/components/PricingTiers';
import { TalkToHumanBar } from '@/components/TalkToHumanBar';

interface Props {
  intake: Intake;
  concepts: ConceptResult[];
  loadingConceptIds: Set<string>;
  onTweak: (concept: ConceptResult, note: string) => void;
  onRequestQuote: (concept: ConceptResult, tier?: PricingTier) => void;
  onRestart: () => void;
}

export function Step6Designs({
  intake,
  concepts,
  loadingConceptIds,
  onTweak,
  onRequestQuote,
  onRestart,
}: Props) {
  const [tweakFor, setTweakFor] = useState<ConceptResult | null>(null);
  const [tweakText, setTweakText] = useState('');
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, 'up' | 'down' | undefined>>({});

  function handleShare(c: ConceptResult) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('concept', c.id);
      navigator.clipboard.writeText(url.toString());
      setCopiedFor(c.id);
      setTimeout(() => setCopiedFor((v) => (v === c.id ? null : v)), 1800);
    } catch (e) {
      console.warn('share failed', e);
    }
  }

  function submitTweak() {
    if (tweakFor && tweakText.trim()) {
      onTweak(tweakFor, tweakText.trim());
      setTweakFor(null);
      setTweakText('');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-orange-400">
            Step 6 — Designs
          </div>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Four concepts. <span className="text-orange-400">Pick a fight.</span>
          </h2>
          <p className="mt-2 max-w-2xl text-ink-200">
            These are AI concepts to spark ideas. Our designers in Charlotte
            refine them into print-ready wraps.
          </p>
        </div>
        <button type="button" onClick={onRestart} className="btn-ghost">
          ↺ Start over
        </button>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {concepts.map((c) => {
          const isLoading = loadingConceptIds.has(c.id);
          const reaction = reactions[c.id];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="gz-card overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-ink-900">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center skeleton">
                    <div className="dot-pulse">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageDataUrl}
                    alt={c.label}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                      Concept · {c.variation}
                    </div>
                    <div className="font-display text-lg font-bold text-white">
                      {c.label}
                    </div>
                    {c.tweakNote && (
                      <div className="mt-1 text-xs text-ink-300 italic">
                        Tweaked: "{c.tweakNote}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = reaction === 'up' ? undefined : 'up';
                        setReactions((r) => ({ ...r, [c.id]: next }));
                        console.log('[reaction]', c.id, next);
                      }}
                      className={[
                        'flex h-9 w-9 items-center justify-center rounded-lg border transition',
                        reaction === 'up'
                          ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                          : 'border-ink-600 text-ink-300 hover:text-white',
                      ].join(' ')}
                      aria-label="Thumbs up"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = reaction === 'down' ? undefined : 'down';
                        setReactions((r) => ({ ...r, [c.id]: next }));
                        console.log('[reaction]', c.id, next);
                      }}
                      className={[
                        'flex h-9 w-9 items-center justify-center rounded-lg border transition',
                        reaction === 'down'
                          ? 'border-ink-400 bg-ink-700 text-white'
                          : 'border-ink-600 text-ink-300 hover:text-white',
                      ].join(' ')}
                      aria-label="Thumbs down"
                    >
                      👎
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTweakFor(c)}
                    disabled={isLoading}
                    className="btn-secondary"
                  >
                    ✎ Tweak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(c)}
                    disabled={isLoading}
                    className="btn-secondary"
                  >
                    {copiedFor === c.id ? 'Copied!' : '⇪ Share'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestQuote(c)}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    I Want This
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12">
        <PricingTiers
          onChoose={(tier) => {
            // Default to the first concept the user reacted up to, else the first.
            const fav =
              concepts.find((c) => reactions[c.id] === 'up') ?? concepts[0];
            if (fav) onRequestQuote(fav, tier);
          }}
        />
      </div>

      <div className="mt-12">
        <TalkToHumanBar />
      </div>

      {/* ===== Tweak modal ===== */}
      {tweakFor && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink-950/80 p-4 sm:items-center"
          onClick={() => setTweakFor(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-ink-600/60 bg-ink-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
              Tweak this concept
            </div>
            <h3 className="mt-2 font-display text-xl font-bold text-white">
              What would you change?
            </h3>
            <textarea
              className="gz-input mt-4 min-h-[120px]"
              placeholder="e.g. Make the logo bigger, swap to a darker blue, add a snowflake graphic to the rear panel…"
              value={tweakText}
              onChange={(e) => setTweakText(e.target.value)}
              autoFocus
            />
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTweakFor(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitTweak}
                disabled={!tweakText.trim()}
                className="btn-primary"
              >
                Regenerate →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
