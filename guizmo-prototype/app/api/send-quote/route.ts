import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { Intake, ConceptResult } from '@/lib/types';
import { INDUSTRY_PROMPTS, VIBE_DESCRIPTORS } from '@/lib/industryPrompts';

// =========================================================================
// /api/send-quote  (v3)
// Sent when the customer clicks "Start with this" on a pricing tier or
// "I Want This One" on a specific concept. Includes the chosen concept
// as an email attachment.
//
// Body: { intake, concept, tier? }
// =========================================================================

export const runtime = 'nodejs';

interface QuoteBody {
  intake: Intake;
  concept: ConceptResult;
  tier?: {
    key: 'decals' | 'partial' | 'full';
    label: string;
    startingPrice: string;
  };
}

function escapeHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pickIndustryLabel(intake: Intake): string {
  if (intake.industry === 'other') {
    return intake.industryOther ? `Other — ${intake.industryOther}` : 'Other';
  }
  return INDUSTRY_PROMPTS[intake.industry]?.label ?? intake.industry;
}

function formatHtml(body: QuoteBody): string {
  const { intake, concept, tier } = body;
  const v = intake.vehicle;
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;max-width:680px;margin:0 auto;padding:24px;">
    <div style="background:#0f1320;color:white;padding:20px 24px;border-radius:12px;margin-bottom:20px;">
      <h1 style="margin:0;font-size:22px;">QUOTE REQUEST — Charlotte Vehicle Wraps</h1>
      <p style="margin:6px 0 0;opacity:0.8;font-size:14px;">${tier ? `Customer chose: <strong>${escapeHtml(tier.label)}</strong> — ${escapeHtml(tier.startingPrice)}` : 'Customer requested a quote on a generated concept.'}</p>
    </div>

    <h2 style="font-size:16px;color:#0f1320;border-bottom:2px solid #ff5a0a;padding-bottom:4px;">Contact</h2>
    <p>
      <strong>${escapeHtml(intake.contact.name)}</strong><br/>
      <a href="mailto:${escapeHtml(intake.contact.email)}">${escapeHtml(intake.contact.email)}</a><br/>
      ${intake.contact.phone ? `<a href="tel:${escapeHtml(intake.contact.phone)}">${escapeHtml(intake.contact.phone)}</a>` : ''}
    </p>

    <h2 style="font-size:16px;color:#0f1320;border-bottom:2px solid #ff5a0a;padding-bottom:4px;">Project</h2>
    <ul style="line-height:1.7;">
      <li><strong>Vehicle:</strong> ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}${v.trim ? ' ' + escapeHtml(v.trim) : ''}</li>
      <li><strong>Industry:</strong> ${escapeHtml(pickIndustryLabel(intake))}</li>
      <li><strong>Vibe:</strong> ${escapeHtml(VIBE_DESCRIPTORS[intake.vibe]?.label ?? intake.vibe)}</li>
      <li><strong>Coverage selected during intake:</strong> ${escapeHtml(intake.coverage)}</li>
      <li><strong>Colors:</strong> ${intake.colors.surpriseMe ? 'Surprise me' : `${escapeHtml(intake.colors.primary)} / ${escapeHtml(intake.colors.secondary)}`}</li>
      <li><strong>Chosen concept:</strong> ${escapeHtml(concept.label)} (variation: ${escapeHtml(concept.variation)})</li>
      ${tier ? `<li><strong>Tier interested in:</strong> ${escapeHtml(tier.label)} — ${escapeHtml(tier.startingPrice)}</li>` : ''}
      ${concept.tweakNote ? `<li><strong>Customer tweak applied:</strong> ${escapeHtml(concept.tweakNote)}</li>` : ''}
    </ul>

    <p>The chosen concept image is attached as <strong>concept.png</strong>.</p>

    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="font-size:12px;color:#6b7280;">Reply directly to reach the customer.</p>
  </div>`;
}

function formatText(body: QuoteBody): string {
  const { intake, concept, tier } = body;
  const v = intake.vehicle;
  return `QUOTE REQUEST — Charlotte Vehicle Wraps
========================================

CONTACT
  ${intake.contact.name}
  ${intake.contact.email}
  ${intake.contact.phone || '—'}

PROJECT
  Vehicle:  ${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}
  Industry: ${pickIndustryLabel(intake)}
  Vibe:     ${VIBE_DESCRIPTORS[intake.vibe]?.label ?? intake.vibe}
  Coverage: ${intake.coverage}
  Colors:   ${intake.colors.surpriseMe ? 'Surprise me' : `${intake.colors.primary} / ${intake.colors.secondary}`}
  Concept:  ${concept.label} (${concept.variation})
${tier ? `  Tier:     ${tier.label} — ${tier.startingPrice}\n` : ''}${concept.tweakNote ? `  Tweak:    ${concept.tweakNote}\n` : ''}
Concept image attached.
`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuoteBody;
    if (!body.intake?.contact?.email || !body.intake?.contact?.name) {
      return NextResponse.json(
        { error: 'intake.contact.name and intake.contact.email are required.' },
        { status: 400 },
      );
    }

    const to = process.env.LEAD_TO_EMAIL || 'info@charlottevehiclewraps.com';
    const from = process.env.LEAD_FROM_EMAIL || 'onboarding@resend.dev';
    const subject = `Quote request — ${body.intake.contact.name} (${body.intake.vehicle.year} ${body.intake.vehicle.make} ${body.intake.vehicle.model})`;

    const html = formatHtml(body);
    const text = formatText(body);

    let attachment: { filename: string; content: string } | null = null;
    if (body.concept.imageDataUrl?.startsWith('data:image/')) {
      const commaIdx = body.concept.imageDataUrl.indexOf(',');
      if (commaIdx > -1) {
        attachment = {
          filename: 'concept.png',
          content: body.concept.imageDataUrl.slice(commaIdx + 1),
        };
      }
    }

    console.log('\n========== QUOTE REQUEST ==========');
    console.log(text);
    console.log('Concept attached:', attachment ? 'yes' : 'no');
    console.log('====================================\n');

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        emailed: false,
        message:
          'Quote logged to server console. (No RESEND_API_KEY set — email not sent.)',
      });
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      to,
      from,
      subject,
      html,
      text,
      replyTo: body.intake.contact.email,
      attachments: attachment ? [attachment] : undefined,
    });
    if (error) {
      console.error('[send-quote] Resend error:', error);
      return NextResponse.json(
        { ok: false, error: error.message ?? String(error) },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, emailed: true, id: data?.id });
  } catch (err: any) {
    console.error('[send-quote] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error.' },
      { status: 500 },
    );
  }
}
