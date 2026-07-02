"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente de browser (anon key): solo lectura vía RLS + suscripciones Realtime.
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
