import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente con service role: solo para server actions y route handlers.
// Bypasea RLS — nunca importar desde componentes cliente.
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (ver .env.example)"
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
