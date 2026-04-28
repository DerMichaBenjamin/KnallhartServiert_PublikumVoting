import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRequest } from '@/lib/adminAuth';
import { getConfigState, getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { mergeSongLists, normalizeSpotifyPlaylistId, parseSongList } from '@/lib/releaseVoting';

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });

  const configState = getConfigState();
  if (!configState.ok) return NextResponse.json({ ok: false, error: configState.message }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const roundId = String(body.roundId ?? '').trim();
  const addSongsRaw = String(body.addSongs ?? '');
  const spotifyPlaylistIdRaw = String(body.spotify_playlist_id ?? '').trim();

  if (!roundId) return NextResponse.json({ ok: false, error: 'Runden-ID fehlt.' }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase-Client konnte nicht erstellt werden.' }, { status: 500 });

  const current = await supabase.from('release_voting_rounds').select('*').eq('id', roundId).maybeSingle();
  if (current.error) return NextResponse.json({ ok: false, error: current.error.message }, { status: 500 });
  if (!current.data) return NextResponse.json({ ok: false, error: 'Umfrage wurde nicht gefunden.' }, { status: 404 });

  const updatePayload: Record<string, unknown> = {};
  const addSongs = parseSongList(addSongsRaw);
  if (addSongs.length > 0) {
    const existingSongs = Array.isArray(current.data.songs_json) ? current.data.songs_json : [];
    updatePayload.songs_json = mergeSongLists(existingSongs, addSongs);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'spotify_playlist_id')) {
    updatePayload.spotify_playlist_id = normalizeSpotifyPlaylistId(spotifyPlaylistIdRaw) || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ ok: false, error: 'Keine Änderung angegeben.' }, { status: 400 });
  }

  const update = await supabase
    .from('release_voting_rounds')
    .update(updatePayload)
    .eq('id', roundId)
    .select('*')
    .single();

  if (update.error) return NextResponse.json({ ok: false, error: update.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, round: update.data });
}
