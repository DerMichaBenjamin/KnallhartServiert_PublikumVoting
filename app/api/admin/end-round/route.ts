import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRequest } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const roundId = String(body.roundId ?? '').trim();
  if (!roundId) return NextResponse.json({ ok: false, error: 'roundId fehlt.' }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase-Client konnte nicht erstellt werden.' }, { status: 500 });

  const update = await supabase
    .from('release_voting_rounds')
    .update({ is_current: false, status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', roundId)
    .select('*')
    .single();

  if (update.error) return NextResponse.json({ ok: false, error: update.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, round: update.data });
}
