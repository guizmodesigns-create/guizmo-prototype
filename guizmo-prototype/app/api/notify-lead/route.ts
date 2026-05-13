import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { Intake } from '@/lib/types';
import { INDUSTRY_PROMPTS, VIBE_DESCRIPTORS } from '@/lib/industryPrompts';

// =========================================================================
// /api/notify-lead  (v3 — THE LEAD GATE)
//
// Sent immediately after Step 5 (Contact) is submitted, BEFORE the user
// waits for the AI to generate concepts. This guarantees Guizmo gets the
// lead even if the user closes the tab during generation.
//
// Body: { intake: Intake }
// =========================================================================

export const runtime = 'nodejs';

interface Body {
  intake: Intake;
}

function pickIndustryLabel(intake: Intake): string {
  if (intake.industry === 'other') {
    return intake.industryOther ? `Other — ${intake.industryOther}` : 'Other';
  }
  return INDUSTRY_PROMPTS[intake.industry]?.label ?? intake.industry;
}

function formatTextEmail(intake: Intake): string {
  const v = intake.vehicle;
  return `NEW LEAD — Charlotte Vehicle Wraps / Guizmo Designs
======================================================

CONTACT
  Name:  ${intake.contact.name}
  Email: ${intake.contact.email}
  Phone: ${intake.contact.phone || '—'}

VEHICLE
  ${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}

INDUSTRY
  ${pickIndustryLabel(intake)}

VIBE
  ${VIBE_DESCRIPTORS[intake.vibe]?.label ?? intake.vibe}

COVERAGE
  ${intake.coverage}

BRAND
  Business name: ${intake.brand.showBusinessName ? intake.brand.businessName || '(blank)' : '(toggle off)'}
  Tagline:       ${intake.brand.showTagline ? intake.brand.tagline || '(blank)' : '(toggle off)'}
  Website:       ${intake.brand.showWebsite ? intake.brand.website || '(blank)' : '(toggle off)'}
  Phone:         ${intake.brand.showPhone ? intake.brand.phone || '(blank)' : '(toggle off)'}

COLORS
  ${intake.colors.surpriseMe ? 'Surprise me' : `Primary ${intake.colors.primary} / Secondary ${intake.colors.secondary}`}

LOGO
  Source: ${intake.logo.source}${intake.logo.fileName ? ' — ' + intake.logo.fileName : ''}${intake.logo.fetchedUrl ? ' — ' + intake.logo.fetchedUrl : ''}

This lead came through the AI wrap concept tool. They are right now
watching the loading animation while their 4 concepts generate. Reply to
this email to reach them directly.
`;
}

function formatHtmlEmail(intake: Intake): string {
  const v = intake.vehicle;
  const industry = pickIndustryLabel(intake);
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;max-width:680px;margin:0 auto;padding:24px;">
    <div style="background:#0f1320;color:white;padding:20px 24px;border-radius:12px;margin-bottom:20px;">
      <h1 style="margin:0;font-size:22px;">NEW LEAD — Charlotte Vehicle Wraps</h1>
      <p style="margin:6px 0 0;opacity:0.8;font-size:14px;">From the AI wrap concept tool. They're watching the loading screen right now.</p>
    </div>

    <h2 style="font-size:16px;color:#0f1320;border-bottom:2px solid #ff5a0a;padding-bottom:4px;">Contact</h2>
    <p style="line-height:1.7;">
      <strong>${escapeHtml(intake.contact.name)}</strong><br/>
      <a href="mailto:${escapeHtml(intake.contact.email)}">${escapeHtml(intake.contact.email)}</a><br/>
      ${intake.contact.phone ? `<a href="tel:${escapeHtml(intake.contact.phone)}">${escapeHtml(intake.contact.phone)}</a>` : ''}
    </p>

    <h2 style="font-size:16px;color:#0f1320;border-bottom:2px solid #ff5a0a;padding-bottom:4px;">Project</h2>
    <ul style="line-height:1.7;">
      <li><strong>Vehicle:</strong> ${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)}${v.trim ? ' ' + escapeHtml(v.trim) : ''}</li>
      <li><strong>Industry:</strong> ${escapeHtml(industry)}</li>
      <li><strong>Vibe:</strong> ${escapeHtml(VIBE_DESCRIPTORS[intake.vibe]?.label ?? intake.vibe)}</li>
      <li><strong>Coverage:</strong> ${escapeHtml(intake.coverage)}</li>
      <li><strong>Colors:</strong> ${intake.colors.surpriseMe ? 'Surprise me' : `${intake.colors.primary} / ${intake.colors.secondary}`}</li>
      <li><strong>Logo:</strong> ${escapeHtml(intake.logo.source)}${intake.logo.fileName ? ' — ' + escapeHtml(intake.logo.fileName) : ''}${intake.logo.fetchedUrl ? ' — ' + escapeHtml(intake.logo.fetchedUrl) : ''}</li>
    </ul>

    <h2 style="font-size:16px;color:#0f1320;border-bottom:2px solid #ff5a0a;padding-bottom:4px;">Brand text</h2>
    <ul style="line-height:1.7;">
      <li><strong>Business name:</strong> ${intake.brand.showBusinessName ? escapeHtml(intake.brand.businessName) || '(blank)' : '(toggle off)'}</li>
      <li><strong>Tagline:</strong> ${intake.brand.showTagline ? escapeHtml(intake.brand.tagline) || '(blank)' : '(toggle off)'}</li>
      <li><strong>Website:</strong> ${intake.brand.showWebsite ? escapeHtml(intake.brand.website) || '(blank)' : '(toggle off)'}</li>
      <li><strong>Phone:</strong> ${intake.brand.showPhone ? escapeHtml(intake.brand.phone) || '(blank)' : '(toggle off)'}</li>
    </ul>

    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="font-size:12px;color:#6b7280;">
      Reply directly to this email to reach the customer.
    </p>
  </div>`;
}

function escapeHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const intake = body.intake;
    if (!intake?.contact?.email || !intake?.contact?.name) {
      return NextResponse.json(
        { error: 'contact.name and contact.email are required.' },
        { status: 400 },
      );
    }

    const to = process.env.LEAD_TO_EMAIL || 'info@charlottevehiclewraps.com';
    const from = process.env.LEAD_FROM_EMAIL || 'onboarding@resend.dev';
    const subject = `New wrap lead — ${intake.contact.name} (${intake.vehicle.year} ${intake.vehicle.make} ${intake.vehicle.model})`;
    const text = formatTextEmail(intake);
    const html = formatHtmlEmail(intake);

    // Always log the payload, regardless of whether email goes out.
    console.log('\n========== NEW LEAD ==========');
    console.log(text);
    console.log('==============================\n');

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        emailed: false,
        message:
          'Lead logged to server console. (No RESEND_API_KEY set — email not sent.)',
      });
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      to,
      from,
      subject,
      html,
      text,
      replyTo: intake.contact.email,
    });
    if (error) {
      console.error('[notify-lead] Resend error:', error);
      return NextResponse.json(
        { ok: false, error: error.message ?? String(error) },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, emailed: true, id: data?.id });
  } catch (err: any) {
    console.error('[notify-lead] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error.' },
      { status: 500 },
    );
  }
}
