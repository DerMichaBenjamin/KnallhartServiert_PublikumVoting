import { NextRequest, NextResponse } from 'next/server';
import { createAdminLoginResponse, hasAdminPasswordConfigured, isValidAdminPassword } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  if (!hasAdminPasswordConfigured()) {
    return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD fehlt.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? '');

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Passwort falsch.' }, { status: 401 });
  }

  return createAdminLoginResponse();
}
