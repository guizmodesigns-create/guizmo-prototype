'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GuizmoLogo } from '@/components/GuizmoLogo';
import { ProgressBar } from '@/components/ProgressBar';
import { TalkToHumanBar } from '@/components/TalkToHumanBar';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Step1Vehicle } from '@/components/steps/Step1Vehicle';
import { Step2Industry } from '@/components/steps/Step2Industry';
import { Step3Style } from '@/components/steps/Step3Style';
import { Step4Brand } from '@/components/steps/Step4Brand';
import { Step4_5Hero } from '@/components/steps/Step4_5Hero';
import { Step5Contact } from '@/components/steps/Step5Contact';
import { Step6Designs } from '@/components/steps/Step6Designs';
import type { PricingTier } from '@/components/PricingTiers';
import type {
  BrandFields,
  ColorPrefs,
  ConceptResult,
  ContactInfo,
  CoverageKey,
  DesignBrief,
  IndustryKey,
  Intake,
  LogoInfo,
  Vehicle,
  VibeKey,
} from '@/lib/types';

const VARIATIONS: ConceptResult['variation'][] = [
  'front-heavy',
  'side-panel',
  'full-coverage',
  'accent-heavy',
];

export default function HomePage() {
  // ============ Wizard state ============
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState<Vehicle>({
    year: '',
    make: '',
    model: '',
    trim: '',
  });
  const [industry, setIndustry] = useState<IndustryKey | ''>('');
  const [industryOther, setIndustryOther] = useState('');
  const [vibe, setVibe] = useState<VibeKey | ''>('');
  const [brand, setBrand] = useState<BrandFields>({
    showBusinessName: true,
    showTagline: false,
    showWebsite: false,
    showPhone: false,
    businessName: '',
    tagline: '',
    website: '',
    phone: '',
  });
  const [colors, setColors] = useState<ColorPrefs>({
    surpriseMe: true,
    primary: '#FF5A0A',
    secondary: '#0F1320',
  });
  const [coverage, setCoverage] = useState<CoverageKey>('partial');
  const [logo, setLogo] = useState<LogoInfo>({ source: 'none' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroImageDataUrl, setHeroImageDataUrl] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactInfo>({
    name: '',
    email: '',
    phone: '',
  });

  // ============ Submission + generation state ============
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<ConceptResult[]>([]);
  const [loadingConceptIds, setLoadingConceptIds] = useState<Set<string>>(new Set());
  const [generationStarted, setGenerationStarted] = useState(false);
  const [allDone, setAllDone] = useState(false);

  function buildIntake(): Intake {
    return {
      vehicle,
      industry: industry as IndustryKey,
      industryOther: industryOther || undefined,
      vibe: vibe as VibeKey,
      brand,
      colors,
      coverage,
      logo,
      contact,
      heroImageDataUrl: heroImageDataUrl || null,
    };
  }

  // =====================================================================
  // Lead notification + parallel concept generation
  // =====================================================================
  const handleStartGeneration = useCallback(async () => {
    setSubmitError(null);
    setSubmitting(true);

    const intake = buildIntake();

    // 1. Fire the lead notification first (don't block on it long).
    try {
      await fetch('/api/notify-lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intake }),
      });
    } catch (err) {
      console.warn('[notify-lead] failed', err);
      // proceed anyway — generation is the priority
    }

    // 2. Get the design brief once.
    let brief: DesignBrief;
    try {
      const briefRes = await fetch('/api/design-brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(intake),
      });
      const briefJson = await briefRes.json();
      if (!briefRes.ok) throw new Error(briefJson.error || 'Brief failed');
      brief = briefJson.brief as DesignBrief;
    } catch (err: any) {
      setSubmitError(
        `Couldn't build your design brief: ${err?.message ?? 'unknown error'}.`,
      );
      setSubmitting(false);
      return;
    }

    // Move to Step 7 — show the loading screen while concepts come in.
    setStep(7);
    setGenerationStarted(true);
    setSubmitting(false);

    // 3. Fire 4 concept requests in parallel.
    const placeholderConcepts: ConceptResult[] = VARIATIONS.map((v, i) => ({
      id: `placeholder-${v}-${i}`,
      label: v,
      imageDataUrl: '',
      variation: v,
    }));
    setConcepts(placeholderConcepts);
    setLoadingConceptIds(new Set(placeholderConcepts.map((p) => p.id)));

    await Promise.all(
      placeholderConcepts.map(async (placeholder, i) => {
        try {
          const fd = new FormData();
          fd.append('intake', JSON.stringify(intake));
          fd.append('brief', JSON.stringify(brief));
          fd.append('variation', placeholder.variation);
          if (logoFile) fd.append('logo', logoFile);
          if (heroImageDataUrl) fd.append('heroImageDataUrl', heroImageDataUrl);
          const res = await fetch('/api/generate-concept', {
            method: 'POST',
            body: fd,
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Generate failed');
          const real = json as ConceptResult;
          setConcepts((prev) => {
            const next = [...prev];
            next[i] = real;
            return next;
          });
          setLoadingConceptIds((prev) => {
            const next = new Set(prev);
            next.delete(placeholder.id);
            return next;
          });
        } catch (err: any) {
          console.error('[generate-concept]', placeholder.variation, err);
          setLoadingConceptIds((prev) => {
            const next = new Set(prev);
            next.delete(placeholder.id);
            return next;
          });
          // Leave placeholder; user can re-tweak or retry.
        }
      }),
    );
    setAllDone(true);
  }, [logoFile, heroImageDataUrl, vehicle, industry, industryOther, vibe, brand, colors, coverage, logo, contact]);

  // =====================================================================
  // Re-generate a single concept with a customer-supplied tweak
  // =====================================================================
  const handleTweak = useCallback(
    async (concept: ConceptResult, note: string) => {
      const intake = buildIntake();
      // We need the brief again — fetch a fresh one. (Could be cached, but
      // a re-roll often benefits from a slightly different brief.)
      let brief: DesignBrief;
      try {
        const briefRes = await fetch('/api/design-brief', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(intake),
        });
        const briefJson = await briefRes.json();
        if (!briefRes.ok) throw new Error(briefJson.error || 'Brief failed');
        brief = briefJson.brief as DesignBrief;
      } catch (err: any) {
        console.error('tweak brief failed', err);
        return;
      }

      // Mark this concept as loading.
      setLoadingConceptIds((prev) => {
        const next = new Set(prev);
        next.add(concept.id);
        return next;
      });

      try {
        const fd = new FormData();
        fd.append('intake', JSON.stringify(intake));
        fd.append('brief', JSON.stringify(brief));
        fd.append('variation', concept.variation);
        fd.append('tweak', note);
        if (logoFile) fd.append('logo', logoFile);
        if (heroImageDataUrl) fd.append('heroImageDataUrl', heroImageDataUrl);
        const res = await fetch('/api/generate-concept', {
          method: 'POST',
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Generate failed');
        const real = json as ConceptResult;
        // Replace in place.
        setConcepts((prev) =>
          prev.map((p) => (p.id === concept.id ? real : p)),
        );
        // Update loading set keyed off the OLD id.
        setLoadingConceptIds((prev) => {
          const next = new Set(prev);
          next.delete(concept.id);
          return next;
        });
      } catch (err) {
        console.error('tweak failed', err);
        setLoadingConceptIds((prev) => {
          const next = new Set(prev);
          next.delete(concept.id);
          return next;
        });
      }
    },
    [logoFile, heroImageDataUrl, vehicle, industry, industryOther, vibe, brand, colors, coverage, logo, contact],
  );

  // =====================================================================
  // Quote request
  // =====================================================================
  const handleRequestQuote = useCallback(
    async (concept: ConceptResult, tier?: PricingTier) => {
      const intake = buildIntake();
      try {
        const res = await fetch('/api/send-quote', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            intake,
            concept,
            tier: tier
              ? {
                  key: tier.key,
                  label: tier.label,
                  startingPrice: tier.startingPrice,
                }
              : undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Quote failed');
        alert(
          json.emailed
            ? "Got it — we'll be in touch within one business day."
            : "Got it — request logged. We'll reach out shortly.",
        );
      } catch (err: any) {
        alert(`Couldn't submit the quote: ${err?.message ?? 'unknown error'}`);
      }
    },
    [vehicle, industry, industryOther, vibe, brand, colors, coverage, logo, contact, heroImageDataUrl],
  );

  function handleRestart() {
    if (!confirm('Start over from the beginning?')) return;
    setStep(1);
    setConcepts([]);
    setGenerationStarted(false);
    setAllDone(false);
    setSubmitError(null);
    setHeroImageDataUrl(null);
  }

  // =====================================================================
  // Render
  // =====================================================================
  const vehicleLabel = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'ride';
  const onStepClick = (n: number) => {
    if (n < step && !generationStarted) setStep(n);
  };

  return (
    <main className="min-h-screen pb-24">
      {/* =============== HEADER =============== */}
      <header className="border-b border-ink-700/40 bg-ink-950/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <GuizmoLogo />
          <div className="hidden text-right md:block">
            <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
              Charlotte's Bold Vehicle Wrap Studio
            </div>
            <a
              href="tel:+17043237608"
              className="font-display text-base font-bold text-white hover:text-orange-300"
            >
              704.323.7608
            </a>
          </div>
        </div>
      </header>

      {/* =============== HERO BANNER (only on Step 1) =============== */}
      {step === 1 && !generationStarted && (
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-2 sm:px-6">
          <div className="bg-grid -mx-4 px-4 py-8 sm:-mx-6 sm:px-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-300">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                AI Wrap Concept Studio
              </div>
              <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
                Let's design something that{' '}
                <span className="text-orange-400">turns heads.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-ink-200 sm:text-lg">
                Seven steps. Five minutes. Four concepts you'll actually want on
                your truck. Built by Charlotte's award-winning wrap shop.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =============== PROGRESS =============== */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <ProgressBar step={step} onStepClick={onStepClick} />
      </section>

      {/* =============== WIZARD =============== */}
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <Step1Vehicle
                value={vehicle}
                onChange={setVehicle}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Step2Industry
                value={industry}
                otherValue={industryOther}
                onChange={setIndustry}
                onOtherChange={setIndustryOther}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step3Style
                value={vibe}
                onChange={setVibe}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <Step4Brand
                brand={brand}
                colors={colors}
                coverage={coverage}
                logo={logo}
                logoFile={logoFile}
                onBrandChange={setBrand}
                onColorsChange={setColors}
                onCoverageChange={setCoverage}
                onLogoChange={setLogo}
                onLogoFileChange={setLogoFile}
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
              />
            )}
            {step === 5 && (
              <Step4_5Hero
                heroImageDataUrl={heroImageDataUrl}
                onHeroChange={setHeroImageDataUrl}
                onNext={() => setStep(6)}
                onBack={() => setStep(4)}
              />
            )}
            {step === 6 && (
              <Step5Contact
                contact={contact}
                brandPhone={brand.phone}
                submitting={submitting}
                error={submitError}
                onChange={setContact}
                onSubmit={handleStartGeneration}
                onBack={() => setStep(5)}
              />
            )}
            {step === 7 && (
              <>
                {!allDone && concepts.length === 0 && (
                  <LoadingScreen vehicleLabel={vehicleLabel} done={false} />
                )}
                {concepts.length > 0 && (
                  <>
                    {!allDone && (
                      <div className="mb-8">
                        <LoadingScreen vehicleLabel={vehicleLabel} done={false} />
                      </div>
                    )}
                    <Step6Designs
                      intake={buildIntake()}
                      concepts={concepts}
                      loadingConceptIds={loadingConceptIds}
                      onTweak={handleTweak}
                      onRequestQuote={handleRequestQuote}
                      onRestart={handleRestart}
                    />
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* =============== FOOTER =============== */}
      <footer className="mt-24 border-t border-ink-700/40 px-4 pt-10 pb-6 text-center text-xs text-ink-300 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p>
            Designed by AI. Crafted by Guizmo's award-winning team in{' '}
            <span className="font-bold text-orange-400">Charlotte, NC.</span>
          </p>
          <p className="mt-2">
            <a href="tel:+17043237608" className="hover:text-white">
              704.323.7608
            </a>{' '}
            ·{' '}
            <a
              href="mailto:info@charlottevehiclewraps.com"
              className="hover:text-white"
            >
              info@charlottevehiclewraps.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
