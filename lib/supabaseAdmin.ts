import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseConfigState =
  | { ok: true; message: string }
  | { ok: false; message: string };

let client: SupabaseClient | null = null;

export function getConfigState(): SupabaseConfigState {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    return { ok: false, message: "NEXT_PUBLIC_SUPABASE_URL fehlt." };
  }

  if (!/^https?:\/\//.test(url)) {
    return { ok: false, message: "NEXT_PUBLIC_SUPABASE_URL ist keine gültige URL." };
  }

  if (!key) {
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY fehlt." };
  }

  return { ok: true, message: "Supabase ist korrekt konfiguriert." };
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  const state = getConfigState();
  if (!state.ok) return null;

  if (!client) {
    client = createAdminClient();
  }

  return client;
}

export function getSupabaseAdmin(): SupabaseClient {
  const state = getConfigState();
  if (!state.ok) {
    throw new Error(state.message);
  }

  if (!client) {
    client = createAdminClient();
  }

  return client;
}

export default getSupabaseAdmin;
