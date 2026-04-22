import { NextResponse } from 'next/server';
import { createVerificationToken, createVerificationWindow, buildVerificationUrl, getEmailVerificationConfigState, hashVerificationToken, sendVerificationEmail } from '@/lib/emailVerification';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getPublicRoundState, type VoteItem } from '@/lib/releaseVoting';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase ist nicht korrekt eingerichtet.' }, { status: 500 });
  }

  const emailConfig = getEmailVerificationConfigState();
  if (!emailConfig.ok) {
    return NextResponse.json({ ok: false, error: emailConfig.message }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const roundId = String(body?.roundId ?? '').trim();
  const jurorName = String(body?.jurorName ?? '').trim();
  const jurorEmail = normalizeEmail(String(body?.jurorEmail ?? ''));
  const jurorInstagram = String(body?.jurorInstagram ?? '').trim();
  const ranking = Array.isArray(body?.ranking) ? (body.ranking as VoteItem[]) : [];

  if (!roundId) {
    return NextResponse.json({ ok: false, error: 'Runden-ID fehlt.' }, { status: 400 });
  }

  if (!jurorName) {
    return NextResponse.json({ ok: false, error: 'Bitte gib deinen Namen ein.' }, { status: 400 });
  }

  if (!jurorEmail || !isValidEmail(jurorEmail)) {
    return NextResponse.json({ ok: false, error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, { status: 400 });
  }

  if (!Array.isArray(ranking) || ranking.length === 0) {
    return NextResponse.json({ ok: false, error: 'Bitte fülle dein Ranking aus.' }, { status: 400 });
  }

  const uniqueSongs = new Set(ranking.map((item) => String(item.song ?? '').trim()));
  if (uniqueSongs.size !== ranking.length) {
    return NextResponse.json({ ok: false, error: 'Jeder Song darf nur einmal vorkommen.' }, { status: 400 });
  }

  const roundResult = await supabase
    .from('release_voting_rounds')
    .select('*')
    .eq('id', roundId)
    .maybeSingle();

  if (roundResult.error || !roundResult.data) {
    return NextResponse.json({ ok: false, error: 'Runde wurde nicht gefunden.' }, { status: 404 });
  }

  const round = roundResult.data;
  const roundState = getPublicRoundState(round as any);

  if (roundState !== 'live') {
    return NextResponse.json({ ok: false, error: 'Diese Umfrage ist derzeit nicht offen.' }, { status: 400 });
  }

  const expectedPlaces = Number(round.places_count ?? 12);
  if (ranking.length !== expectedPlaces) {
    return NextResponse.json({ ok: false, error: `Bitte belege alle ${expectedPlaces} Plätze.` }, { status: 400 });
  }

  const pointsSet = new Set(ranking.map((item) => Number(item.points)));
  if (pointsSet.size !== ranking.length) {
    return NextResponse.json({ ok: false, error: 'Jede Punktzahl darf nur einmal vergeben werden.' }, { status: 400 });
  }

  const existingResult = await supabase
    .from('release_voting_votes')
    .select('*')
    .eq('round_id', roundId)
    .eq('juror_email', jurorEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingResult.error) {
    return NextResponse.json({ ok: false, error: existingResult.error.message }, { status: 500 });
  }

  const existing = (existingResult.data?.[0] ?? null) as any;

  if (existing?.is_verified) {
    return NextResponse.json({ ok: false, error: 'Für diese E-Mail-Adresse wurde das Voting bereits bestätigt.' }, { status: 400 });
  }

  const token = createVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const verificationWindow = createVerificationWindow(48);

  if (existing) {
    const updateResult = await supabase
      .from('release_voting_votes')
      .update({
        juror_name: jurorName,
        juror_instagram: jurorInstagram || null,
        ranking_json: ranking,
        is_verified: false,
        verified_at: null,
        verify_token_hash: tokenHash,
        verify_expires_at: verificationWindow.expiresAt,
        verification_sent_at: verificationWindow.sentAt,
      })
      .eq('id', existing.id);

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: updateResult.error.message }, { status: 500 });
    }
  } else {
    const insertResult = await supabase.from('release_voting_votes').insert({
      round_id: roundId,
      juror_name: jurorName,
      juror_email: jurorEmail,
      juror_instagram: jurorInstagram || null,
      ranking_json: ranking,
      is_verified: false,
      verify_token_hash: tokenHash,
      verify_expires_at: verificationWindow.expiresAt,
      verification_sent_at: verificationWindow.sentAt,
    });

    if (insertResult.error) {
      return NextResponse.json({ ok: false, error: insertResult.error.message }, { status: 500 });
    }
  }

  const verificationUrl = buildVerificationUrl(token);

  try {
    await sendVerificationEmail({
      to: jurorEmail,
      roundTitle: round.title,
      verificationUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Bestätigungs-Mail konnte nicht gesendet werden.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Bitte bestätige dein Voting über den Link in deiner E-Mail.',
  });
}
