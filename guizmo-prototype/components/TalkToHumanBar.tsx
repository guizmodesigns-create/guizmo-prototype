'use client';

import React from 'react';

export function TalkToHumanBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className="gz-card overflow-hidden">
      <div className="relative px-6 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
        <div className="relative">
          {!compact && (
            <>
              <div className="text-xs font-black uppercase tracking-widest text-orange-400">
                The Local Difference
              </div>
              <h3 className="mt-2 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Want to skip the AI and{' '}
                <span className="text-orange-400">talk to actual humans?</span>
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-ink-200">
                We're right here in Charlotte. Phones picked up by a real
                designer, not an answering service.
              </p>
            </>
          )}

          <div
            className={`mt-${compact ? '0' : '5'} grid gap-3 sm:grid-cols-3`}
          >
            <a
              href="tel:+17043237608"
              className="group flex items-center gap-3 rounded-xl border border-ink-600/50 bg-ink-900/60 px-4 py-4 transition hover:border-orange-500/60 hover:bg-orange-500/10"
            >
              <div className="text-2xl">📞</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Call us
                </div>
                <div className="font-display text-lg font-bold text-white">
                  704.323.7608
                </div>
              </div>
            </a>
            <a
              href="mailto:info@charlottevehiclewraps.com"
              className="group flex items-center gap-3 rounded-xl border border-ink-600/50 bg-ink-900/60 px-4 py-4 transition hover:border-orange-500/60 hover:bg-orange-500/10"
            >
              <div className="text-2xl">✉️</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Email
                </div>
                <div className="font-display text-sm font-bold text-white break-all">
                  info@charlottevehiclewraps.com
                </div>
              </div>
            </a>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="group flex items-center gap-3 rounded-xl border border-ink-600/50 bg-ink-900/40 px-4 py-4 opacity-70"
            >
              <div className="text-2xl">📅</div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Schedule a Call
                </div>
                <div className="font-display text-sm font-bold text-white">
                  Coming soon
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
