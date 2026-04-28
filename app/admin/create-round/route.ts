import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRequest } from '@/lib/adminAuth';
import { getConfigState, getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { normalizeSlug, normalizeSpotifyPlaylistId, parseSongList } from '@/lib/releaseVoting';

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });

  const configState = getConfigState();
  if (!configState.ok) return NextResponse.json({ ok: false, error: configState.message }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const slug = normalizeSlug(String(body.slug ?? '').trim() || title);
  const description = String(body.description ?? '').trim() || null;
  const status = String(body.status ?? 'live').trim() as 'draft' | 'live' | 'ended';
  const startAt = String(body.start_at ?? '').trim();
  const endAt = String(body.end_at ?? '').trim();
  const placesCount = Number(body.places_count ?? 12);
  const songs = parseSongList(String(body.songlist ?? ''));
  const spotifyPlaylistId = normalizeSpotifyPlaylistId(String(body.spotify_playlist_id ?? '').trim()) || null;

  if (!title) return NextResponse.json({ ok: false, error: 'Bitte einen Titel eingeben.' }, { status: 400 });
  if (!slug) return NextResponse.json({ ok: false, error: 'Bitte einen gültigen Slug eingeben.' }, { status: 400 });
  if (!['draft', 'live', 'ended'].includes(status)) return NextResponse.json({ ok: false, error: 'Ungültiger Status.' }, { status: 400 });
  if (!startAt || !endAt) return NextResponse.json({ ok: false, error: 'Bitte Start- und Enddatum angeben.' }, { status: 400 });
  if (Number.isNaN(new Date(startAt).getTime()) || Number.isNaN(new Date(endAt).getTime())) return NextResponse.json({ ok: false, error: 'Start oder Ende ist kein gültiges Datum.' }, { status: 400 });
  if (new Date(startAt).getTime() >= new Date(endAt).getTime()) return NextResponse.json({ ok: false, error: 'Das Enddatum muss nach dem Startdatum liegen.' }, { status: 400 });
  if (!Number.isInteger(placesCount) || placesCount < 1 || placesCount > 50) return NextResponse.json({ ok: false, error: 'Die Platzanzahl muss zwischen 1 und 50 liegen.' }, { status: 400 });
  if (songs.length === 0) return NextResponse.json({ ok: false, error: 'Bitte mindestens einen Song eintragen.' }, { status: 400 });
  if (songs.length < placesCount) return NextResponse.json({ ok: false, error: `Es sind nur ${songs.length} Songs vorhanden, aber ${placesCount} Plätze eingestellt.` }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase-Client konnte nicht erstellt werden.' }, { status: 500 });

  const slugCheck = await supabase.from('release_voting_rounds').select('id').eq('slug', slug).maybeSingle();
  if (slugCheck.error) return NextResponse.json({ ok: false, error: slugCheck.error.message }, { status: 500 });
  if (slugCheck.data) return NextResponse.json({ ok: false, error: 'Dieser Slug existiert bereits.' }, { status: 400 });

  if (status === 'live') {
    const unset = await supabase.from('release_voting_rounds').update({ is_current: false }).eq('is_current', true);
    if (unset.error) return NextResponse.json({ ok: false, error: unset.error.message }, { status: 500 });
  }

  const payload = {
    title,
    slug,
    description,
    status,
    start_at: startAt,
    end_at: endAt,
    places_count: placesCount,
    is_current: status === 'live',
    songs_json: songs,
    spotify_playlist_id: spotifyPlaylistId,
    ended_at: status === 'ended' ? new Date().toISOString() : null,
  };

  const insert = await supabase.from('release_voting_rounds').insert(payload).select('*').single();
  if (insert.error) return NextResponse.json({ ok: false, error: insert.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, round: insert.data });
}
