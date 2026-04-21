import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const roundId = String(body.roundId ?? '').trim();
  const jurorName = String(body.jurorName ?? '').trim() || null;
  const jurorEmail = String(body.jurorEmail ?? '').trim() || null;
  const jurorInstagram = String(body.jurorInstagram ?? '').trim() || null;
  const ranking = Array.isArray(body.ranking) ? body.ranking : [];

  if (!roundId) return NextResponse.json({ ok: false, error: 'roundId fehlt.' }, { status: 400 });
  if (!jurorName) return NextResponse.json({ ok: false, error: 'Bitte einen Namen eingeben.' }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase-Client konnte nicht erstellt werden.' }, { status: 500 });

  const roundQuery = await supabase.from('release_voting_rounds').select('*').eq('id', roundId).maybeSingle();
  if (roundQuery.error) return NextResponse.json({ ok: false, error: roundQuery.error.message }, { status: 500 });
  if (!roundQuery.data) return NextResponse.json({ ok: false, error: 'Umfrage nicht gefunden.' }, { status: 404 });

  const round = roundQuery.data;
  if (round.status !== 'live') return NextResponse.json({ ok: false, error: 'Diese Umfrage ist nicht live.' }, { status: 400 });

  const now = Date.now();
  if (new Date(round.start_at).getTime() > now) {
    return NextResponse.json({ ok: false, error: 'Diese Umfrage hat noch nicht begonnen.' }, { status: 400 });
  }
  if (new Date(round.end_at).getTime() < now) {
    return NextResponse.json({ ok: false, error: 'Diese Umfrage ist bereits beendet.' }, { status: 400 });
  }

  if (ranking.length !== round.places_count) {
    return NextResponse.json({ ok: false, error: `Bitte genau ${round.places_count} Plätze belegen.` }, { status: 400 });
  }

  const allowedSongs = new Set(Array.isArray(round.songs_json) ? round.songs_json : []);
  const allowedPoints = new Set(Array.from({ length: round.places_count }, (_, index) => round.places_count - index));
  const seenSongs = new Set<string>();
  const seenPoints = new Set<number>();

  for (const item of ranking) {
    const song = String(item.song ?? '').trim();
    const points = Number(item.points);

    if (!song || !allowedSongs.has(song)) {
      return NextResponse.json({ ok: false, error: `Ungültiger Song im Voting: ${song || 'leer'}` }, { status: 400 });
    }
    if (!Number.isInteger(points) || !allowedPoints.has(points)) {
      return NextResponse.json({ ok: false, error: `Ungültige Punktzahl: ${points}` }, { status: 400 });
    }
    if (seenSongs.has(song)) {
      return NextResponse.json({ ok: false, error: 'Jeder Song darf nur einmal vorkommen.' }, { status: 400 });
    }
    if (seenPoints.has(points)) {
      return NextResponse.json({ ok: false, error: 'Jede Punktzahl darf nur einmal vergeben werden.' }, { status: 400 });
    }

    seenSongs.add(song);
    seenPoints.add(points);
  }

  const insert = await supabase.from('release_voting_votes').insert({
    round_id: roundId,
    juror_name: jurorName,
    juror_email: jurorEmail,
    juror_instagram: jurorInstagram,
    ranking_json: ranking,
  });

  if (insert.error) return NextResponse.json({ ok: false, error: insert.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
