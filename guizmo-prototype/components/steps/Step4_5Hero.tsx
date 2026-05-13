'use client';

import React, { useCallback, useRef, useState } from 'react';

const MAX_HERO_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function Step4_5Hero({
  heroImageDataUrl,
  onHeroChange,
  onNext,
  onBack,
}: {
  heroImageDataUrl: string | null | undefined;
  onHeroChange: (dataUrl: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function processFile(file: File) {
    setUploadError(null);
    const mimeOk =
      ALLOWED_MIME.includes(file.type) ||
      /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    if (!mimeOk) {
      setUploadError('PNG, JPG, WEBP, or GIF only please.');
      return;
    }
    if (file.size > MAX_HERO_BYTES) {
      setUploadError('Max 10 MB. Try a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onHeroChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function clearImage() {
    onHeroChange(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-orange-400">
        Step 5 — Inspiration
      </div>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
        Got a photo that{' '}
        <span className="text-orange-400">inspires you?</span>
      </h2>
      <p className="mt-3 max-w-2xl text-ink-200">
        Upload a reference image and we'll fold its energy into your concepts.
        Totally optional — skip it if you're going all-original.
      </p>

      <div className="mt-8 max-w-2xl">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={[
            'relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-12 px-8 text-center transition',
            dragging
              ? 'border-orange-400 bg-orange-500/10'
              : heroImageDataUrl
              ? 'border-orange-500/40 bg-ink-800/40'
              : 'border-ink-500/50 bg-ink-800/30 hover:border-orange-400/60 hover:bg-ink-800/50',
          ].join(' ')}
        >
          {heroImageDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImageDataUrl}
                alt="Your reference image"
                className="max-h-64 max-w-full rounded-xl object-contain shadow-lg"
              />
              <div className="text-sm text-ink-200">
                Click to replace, or use the Clear button below.
              </div>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-600/50 bg-ink-800/80 text-3xl">
                🖼️
              </div>
              <div>
                <div className="font-display text-lg font-bold text-white">
                  Drop an image here
                </div>
                <div className="mt-1 text-sm text-ink-300">
                  or click to browse — PNG, JPG, WEBP up to 10 MB
                </div>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileSelect}
          className="sr-only"
        />

        {uploadError && (
          <p className="mt-3 text-sm text-red-400">{uploadError}</p>
        )}

        {heroImageDataUrl && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              className="text-xs font-bold uppercase tracking-wider text-ink-300 hover:text-orange-400 transition"
            >
              Clear image
            </button>
          </div>
        )}

        <p className="mt-4 text-xs text-ink-400">
          Examples: a photo of your truck, a job site shot, a competitor wrap
          you admire, or a color palette you love. We'll draw visual cues from
          it — the final design is still 100% yours.
        </p>
      </div>

      <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className="btn-ghost">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNext}
            className="btn-secondary"
          >
            Skip this →
          </button>
          <button
            type="button"
            onClick={onNext}
            className="btn-primary"
          >
            {heroImageDataUrl ? 'Continue →' : 'Skip & Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
