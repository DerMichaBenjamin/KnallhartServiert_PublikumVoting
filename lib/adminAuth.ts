import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "ks_admin_session";

function getAdminPassword() {
  return (process.env.ADMIN_PASSWORD ?? "").trim();
}

export function hasAdminPasswordConfigured() {
  return getAdminPassword().length > 0;
}

export function isValidAdminPassword(password: string) {
  return hasAdminPasswordConfigured() && password === getAdminPassword();
}

function getAdminSessionValue() {
  return getAdminPassword();
}

function parseCookies(cookieHeader: string | null) {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    result[rawKey] = decodeURIComponent(rawValue.join("=") || "");
  }

  return result;
}

export function ensureAdminRequest(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const current = cookies[ADMIN_COOKIE_NAME];
  const expected = getAdminSessionValue();

  if (!expected || current !== expected) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  return null;
}

export function createAdminLoginResponse(
  body: unknown = { ok: true, success: true }
) {
  const response = NextResponse.json(body);

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: getAdminSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function createAdminLogoutResponse(
  body: unknown = { ok: true, success: true }
) {
  const response = NextResponse.json(body);

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
