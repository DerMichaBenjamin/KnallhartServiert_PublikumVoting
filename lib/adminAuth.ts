import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE_NAME = 'khs_admin_session';
const ADMIN_COOKIE_VALUE = 'ok';

export function hasAdminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim());
}

export function isValidAdminPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD ?? '';
  return Boolean(configured) && password === configured;
}

export function isAdminAuthenticated(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}

export function ensureAdminRequest(request: NextRequest) {
  if (!hasAdminPasswordConfigured()) {
    return { ok: false as const, error: 'ADMIN_PASSWORD fehlt in den Environment Variables.' };
  }

  if (!isAdminAuthenticated(request)) {
    return { ok: false as const, error: 'Nicht autorisiert.' };
  }

  return { ok: true as const };
}

export function createAdminLoginResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export function createAdminLogoutResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
