'use client';

import React, { useEffect } from 'react';
import type { ContactInfo } from '@/lib/types';

export function Step5Contact({
  contact,
  brandPhone,
  submitting,
  error,
  onChange,
  onSubmit,
  onBack,
}: {
  contact: ContactInfo;
  brandPhone: string;
  submitting: boolean;
  error: string | null;
  onChange: (c: ContactInfo) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  // Pre-fill phone from Step 4 if Contact phone is blank.
  useEffect(() => {
    if (!contact.phone && brandPhone) {
      onChange({ ...contact, phone: brandPhone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emailOk =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
  const canSubmit =
    contact.name.trim().length > 1 && emailOk && !submitting;

  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-orange-400">
        Step 6 — Contact
      </div>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
        Almost there — where should we{' '}
        <span className="text-orange-400">send your designs?</span>
      </h2>

      <div className="mt-6 max-w-xl gz-card p-8 space-y-4">
        <div>
          <label className="gz-label">Your name</label>
          <input
            type="text"
            className="gz-input"
            placeholder="First and last"
            value={contact.name}
            onChange={(e) => onChange({ ...contact, name: e.target.value })}
          />
        </div>
        <div>
          <label className="gz-label">Where can we send your concepts?</label>
          <input
            type="email"
            className="gz-input"
            placeholder="you@business.com"
            value={contact.email}
            onChange={(e) => onChange({ ...contact, email: e.target.value })}
          />
        </div>
        <div>
          <label className="gz-label">
            Best number to reach you{' '}
            <span className="font-normal normal-case tracking-normal text-ink-400">(optional)</span>
          </label>
          <input
            type="tel"
            className="gz-input"
            placeholder="704-555-1234"
            value={contact.phone}
            onChange={(e) => onChange({ ...contact, phone: e.target.value })}
          />
        </div>

        <p className="text-xs text-ink-300">
          We hate spam. We'll send your designs and follow up if you want to
          talk. That's it.
        </p>
      </div>

      {error && (
        <div className="mt-4 max-w-xl rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className="btn-ghost">
          ← Back
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="btn-mega"
        >
          {submitting ? 'Sending…' : '⚡ Generate My Designs'}
        </button>
      </div>
    </div>
  );
}
