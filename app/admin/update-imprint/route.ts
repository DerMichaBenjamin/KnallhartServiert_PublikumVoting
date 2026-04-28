import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRequest } from '@/lib/adminAuth';
import { getConfigState, getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });

  const configState = getConfigState();
  if (!configState.ok) return NextResponse.json({ ok: false, error: configState.message }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const content = String(body.content ?? '').trim();

  if (!content) {
    return NextResponse.json({ ok: false, error: 'Impressum darf nicht leer sein.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase-Client konnte nicht erstellt werden.' }, { status: 500 });

  const { data, error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: 'imprint',
        value_json: { content },
      },
      { onConflict: 'key' }
    )
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, setting: data });
}
