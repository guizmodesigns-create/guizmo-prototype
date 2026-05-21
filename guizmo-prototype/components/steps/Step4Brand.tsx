'use client';

import React, { useRef, useState } from 'react';
import type {
  BrandFields,
  ColorPrefs,
  CoverageKey,
  LogoInfo,
} from '@/lib/types';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_MIME = ['image/png', 'image/jpeg', 'image/svg+xml'];

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="gz-toggle"
      data-on={on}
    >
      <span className="gz-toggle-knob" />
    </button>
  );
}

export function Step4Brand({
  brand,
  colors,
  coverage,
  logo,
  // raw File kept in parent for FormData submission
  logoFile,
  onBrandChange,
  onColorsChange,
  onCoverageChange,
  onLogoChange,
  onLogoFileChange,
  onNext,
  onBack,
}: {
  brand: BrandFields;
  colors: ColorPrefs;
  coverage: CoverageKey;
  logo: LogoInfo;
  logoFile: File | null;
  onBrandChange: (b: BrandFields) => void;
  onColorsChange: (c: ColorPrefs) => void;
  onCoverageChange: (c: CoverageKey) => void;
  onLogoChange: (l: LogoInfo) => void;
  onLogoFileChange: (f: File | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [logoTab, setLogoTab] = useState<'upload' | 'url'>(
    logo.source === 'url' ? 'url' : 'upload',
  );
  const [urlInput, setUrlInput] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fetchedMeta, setFetchedMeta] = useState<{ strategy: string; score: number; width: number; height: number } | null>(null);
  // After a successful URL fetch, show a confirmation panel before fully committing
  const [pendingFetch, setPendingFetch] = useState<{ dataUrl: string; sourceUrl: string; strategy: string; score: number; width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_LOGO_MIME.includes(file.type) && !/\.(png|jpe?g|svg)$/i.test(file.name)) {
      setUploadError('Only PNG, JPG, or SVG, please.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setUploadError('Max 5 MB. Compress the logo and try again.');
      e.target.value = '';
      return;
    }
    // Read as data URL for preview.
    const reader = new FileReader();
    reader.onload = () => {
      onLogoFileChange(file);
      onLogoChange({
        source: 'upload',
        fileName: file.name,
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleFetchLogo() {
    setFetchError(null);
    setPendingFetch(null);
    if (!urlInput.trim()) return;
    setFetchingLogo(true);
    try {
      const res = await fetch('/api/fetch-logo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Fetch failed');
      // Show the preview/confirmation panel instead of immediately committing.
      setPendingFetch({
        dataUrl: json.dataUrl,
        sourceUrl: json.sourceUrl,
        strategy: json.strategy ?? 'unknown',
        score: json.score ?? 0,
        width: json.width ?? 0,
        height: json.height ?? 0,
      });
    } catch (err: any) {
      setFetchError(err?.message ?? 'Could not fetch logo.');
    } finally {
      setFetchingLogo(false);
    }
  }

  async function confirmFetchedLogo() {
    if (!pendingFetch) return;
    const { dataUrl, sourceUrl, strategy, score, width, height } = pendingFetch;
    setFetchedMeta({ strategy, score, width, height });
    // Convert data URL to a File so it can be submitted with FormData later.
    const fileBlob = await (await fetch(dataUrl)).blob();
    const file = new File([fileBlob], 'fetched-logo.png', { type: 'image/png' });
    onLogoFileChange(file);
    onLogoChange({
      source: 'url',
      fileName: 'fetched-logo.png',
      fetchedUrl: sourceUrl,
      dataUrl,
    });
    setPendingFetch(null);
  }

  function reFetchLogo() {
    setPendingFetch(null);
    setFetchError(null);
  }

  function switchToUpload() {
    setPendingFetch(null);
    setFetchError(null);
    setLogoTab('upload');
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  function clearLogo() {
    onLogoFileChange(null);
    onLogoChange({ source: 'none' });
    setPendingFetch(null);
    setFetchedMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function randomizeColors() {
    // Simple HSL-based picker — keeps colors saturated and vivid.
    const h1 = Math.floor(Math.random() * 360);
    const h2 = (h1 + 120 + Math.floor(Math.random() * 120)) % 360;
    onColorsChange({
      ...colors,
      primary: hslToHex(h1, 80, 50),
      secondary: hslToHex(h2, 75, 55),
    });
  }

  const coverageOptions: Array<{
    key: CoverageKey;
    title: string;
    blurb: string;
  }> = [
    {
      key: 'decals',
      title: 'Decals & Lettering',
      blurb: 'Logo, business info, accent stripes. Cleanest budget option.',
    },
    {
      key: 'partial',
      title: 'Partial Wrap',
      blurb: 'Sides, rear, and key panels. Big impact, less surface.',
    },
    {
      key: 'full',
      title: 'Full Wrap',
      blurb: 'Every panel covered. Maximum billboard.',
    },
  ];

  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-orange-400">
        Step 4 — Brand
      </div>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
        Show us your <span className="text-orange-400">brand.</span>
      </h2>
      <p className="mt-3 max-w-2xl text-ink-200">
        Logo, the words that matter, the colors. The more you give us, the
        sharper your concepts come back.
      </p>

      {/* =================== LOGO =================== */}
      <div className="mt-8 gz-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
              Logo
            </div>
            <div className="mt-1 font-display text-lg font-bold text-white">
              Upload or pull from your site
            </div>
          </div>
          {logo.source !== 'none' && (
            <button
              type="button"
              onClick={clearLogo}
              className="text-xs font-bold uppercase tracking-wider text-ink-300 hover:text-orange-400"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 inline-flex rounded-lg border border-ink-600 bg-ink-900 p-1 text-xs font-bold uppercase tracking-wider">
          {(['upload', 'url'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setLogoTab(t)}
              className={[
                'px-4 py-2 rounded-md transition',
                logoTab === t
                  ? 'bg-orange-500 text-ink-950'
                  : 'text-ink-200 hover:text-white',
              ].join(' ')}
            >
              {t === 'upload' ? 'Upload file' : 'Pull from website'}
            </button>
          ))}
        </div>

        {logoTab === 'upload' && (
          <div className="mt-4">
            <label className="block">
              <span className="sr-only">Upload logo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                onChange={handleFileSelect}
                className="block w-full text-sm text-ink-200 file:mr-3 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-wider file:text-ink-950 hover:file:bg-orange-400"
              />
            </label>
            <p className="mt-2 text-xs text-ink-300">
              PNG, JPG, or SVG. Max 5 MB. Transparent PNGs look best.
            </p>
            {uploadError && (
              <p className="mt-2 text-sm text-red-400">{uploadError}</p>
            )}
          </div>
        )}

        {logoTab === 'url' && (
          <div className="mt-4">
            {/* Pending fetch preview — confirm before committing */}
            {pendingFetch ? (
              <div className="rounded-xl border border-orange-500/40 bg-orange-500/5 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Found a logo — does this look right?
                </div>
                <div className="mt-3 flex items-center gap-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-ink-600/50 bg-white/10 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingFetch.dataUrl}
                      alt="Fetched logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="truncate text-white font-semibold">{pendingFetch.sourceUrl.split('/').pop() ?? 'logo'}</div>
                    <div className="mt-1 text-ink-300 text-xs">
                      {pendingFetch.width}×{pendingFetch.height}px · via {pendingFetch.strategy} · score {pendingFetch.score}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmFetchedLogo}
                    className="btn-primary"
                  >
                    Use this logo
                  </button>
                  <button
                    type="button"
                    onClick={reFetchLogo}
                    className="btn-secondary"
                  >
                    Try a different URL
                  </button>
                  <button
                    type="button"
                    onClick={switchToUpload}
                    className="btn-ghost"
                  >
                    Upload my own instead
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    inputMode="url"
                    className="gz-input"
                    placeholder="https://your-website.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={fetchingLogo || !urlInput.trim()}
                    onClick={handleFetchLogo}
                    className="btn-primary whitespace-nowrap"
                  >
                    {fetchingLogo ? 'Fetching…' : 'Fetch Logo'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-ink-300">
                  We'll scan your homepage for the best available logo.
                </p>
                {fetchError && (
                  <p className="mt-2 text-sm text-red-400">{fetchError}</p>
                )}
              </>
            )}
          </div>
        )}

        {logo.dataUrl && (
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-ink-600/50 bg-ink-900/60 p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/10 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.dataUrl}
                alt="Logo preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-widest text-orange-400">
                Got it
              </div>
              <div className="truncate font-display text-base font-bold text-white">
                {logo.fileName ?? 'Logo'}
              </div>
              {logo.fetchedUrl && (
                <div className="truncate text-xs text-ink-300">
                  Source: {logo.fetchedUrl}
                </div>
              )}
              {fetchedMeta && (
                <div className="mt-1 text-xs text-ink-400">
                  {fetchedMeta.width}×{fetchedMeta.height}px · via {fetchedMeta.strategy}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =================== BRAND TEXT =================== */}
      <div className="mt-6 gz-card p-8">
        <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
          Brand text
        </div>
        <div className="mt-1 font-display text-lg font-bold text-white">
          Flip what you want on the wrap
        </div>

        <div className="mt-4 space-y-4">
          <ToggleRow
            label="Business Name"
            on={brand.showBusinessName}
            onToggle={(v) => onBrandChange({ ...brand, showBusinessName: v })}
          >
            <input
              type="text"
              className="gz-input"
              placeholder="e.g. Grow Pro Landscaping"
              value={brand.businessName}
              onChange={(e) =>
                onBrandChange({ ...brand, businessName: e.target.value })
              }
            />
          </ToggleRow>

          <ToggleRow
            label="Tagline / Slogan"
            on={brand.showTagline}
            onToggle={(v) => onBrandChange({ ...brand, showTagline: v })}
          >
            <input
              type="text"
              className="gz-input"
              placeholder="e.g. We mow it, you go to it."
              value={brand.tagline}
              onChange={(e) =>
                onBrandChange({ ...brand, tagline: e.target.value })
              }
            />
          </ToggleRow>

          <ToggleRow
            label="Website"
            on={brand.showWebsite}
            onToggle={(v) => onBrandChange({ ...brand, showWebsite: v })}
          >
            <input
              type="url"
              className="gz-input"
              placeholder="growpro.com"
              value={brand.website}
              onChange={(e) =>
                onBrandChange({ ...brand, website: e.target.value })
              }
            />
          </ToggleRow>

          <ToggleRow
            label="Phone Number"
            on={brand.showPhone}
            onToggle={(v) => onBrandChange({ ...brand, showPhone: v })}
          >
            <input
              type="tel"
              className="gz-input"
              placeholder="704-555-1234"
              value={brand.phone}
              onChange={(e) =>
                onBrandChange({ ...brand, phone: e.target.value })
              }
            />
          </ToggleRow>
        </div>
      </div>

      {/* =================== COLORS =================== */}
      <div className="mt-6 gz-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
              Colors
            </div>
            <div className="mt-1 font-display text-lg font-bold text-white">
              Pick your palette
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <span className="font-bold uppercase tracking-wider text-ink-200">
              Surprise me
            </span>
            <Toggle
              on={colors.surpriseMe}
              onChange={(v) => onColorsChange({ ...colors, surpriseMe: v })}
            />
          </label>
        </div>

        {!colors.surpriseMe && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ColorPickerRow
              label="Primary"
              value={colors.primary}
              onChange={(v) => onColorsChange({ ...colors, primary: v })}
            />
            <ColorPickerRow
              label="Secondary"
              value={colors.secondary}
              onChange={(v) => onColorsChange({ ...colors, secondary: v })}
            />
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={randomizeColors}
                className="btn-ghost"
              >
                🎲 Randomize
              </button>
            </div>
          </div>
        )}

        {colors.surpriseMe && (
          <p className="mt-3 text-sm text-ink-200">
            We'll pick a palette that crushes for your industry.
          </p>
        )}
      </div>

      {/* =================== COVERAGE =================== */}
      <div className="mt-6 gz-card p-8">
        <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
          Coverage
        </div>
        <div className="mt-1 font-display text-lg font-bold text-white">
          How much wrap?
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {coverageOptions.map((opt) => {
            const active = coverage === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onCoverageChange(opt.key)}
                data-active={active}
                className="choice-card"
              >
                <div className="font-display text-base font-bold text-white">
                  {opt.title}
                </div>
                <div className="mt-2 text-xs text-ink-200">{opt.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn-ghost">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          Continue →
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  on,
  onToggle,
  children,
}: {
  label: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-bold uppercase tracking-wider text-sm text-ink-200">
          {label}
        </span>
        <Toggle on={on} onChange={onToggle} />
      </div>
      {on && <div className="mt-2">{children}</div>}
    </div>
  );
}

function ColorPickerRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="gz-label">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-16 cursor-pointer rounded-lg border border-ink-600 bg-ink-800"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="gz-input font-mono uppercase"
        />
      </div>
    </div>
  );
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}
