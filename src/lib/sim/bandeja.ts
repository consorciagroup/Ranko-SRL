import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MensajeSalida } from "@/lib/bot/salida";

// Acceso a `sim_inbox`: el hilo de mensajes por técnico que alimenta el
// simulador. Un mensaje del bot guarda un MensajeSalida; los del técnico y los
// de sistema guardan { texto }.

export type BandejaLado = "bot" | "tecnico" | "sistema";

export type BandejaMsg = {
  id: number;
  lado: BandejaLado;
  payload: MensajeSalida | { texto: string };
};

export async function leerBandeja(tecnicoId: string): Promise<BandejaMsg[]> {
  const { data, error } = await supabaseAdmin()
    .from("sim_inbox")
    .select("id, lado, payload")
    .eq("tecnico_id", tecnicoId)
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []) as BandejaMsg[];
}

export async function appendBandeja(
  tecnicoId: string,
  lado: BandejaLado,
  payload: MensajeSalida | { texto: string }
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("sim_inbox")
    .insert({ tecnico_id: tecnicoId, lado, payload });
  if (error) throw new Error(error.message);
}

export async function limpiarBandeja(tecnicoId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("sim_inbox")
    .delete()
    .eq("tecnico_id", tecnicoId);
  if (error) throw new Error(error.message);
}
