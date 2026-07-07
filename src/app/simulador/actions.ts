"use server";

import { procesarMensaje } from "@/lib/bot/engine";
import { construirMenuParadas, hoyISO } from "@/lib/bot/menu";
import { simDeps } from "@/lib/bot/simDeps";
import type { MensajeSalida } from "@/lib/bot/salida";
import type { EstadoConversacion } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabase/server";

// Un turno de conversación: corre el mensaje entrante por el MISMO motor que el
// webhook real y devuelve lo que el bot "respondería", para pintarlo en el chat.
export type EntradaSimulada = {
  telefono: string;
  texto?: string;
  interactiveId?: string;
  // El técnico "mandó una foto" (para los ítems tipo foto del checklist)
  imagen?: boolean;
};

// Estado al abrir el chat, sin mandar ningún mensaje (lectura pura, no muta
// nada). Si el técnico está en el menú, muestra sus paradas de hoy; si está a
// mitad de un flujo, informa el paso para que se sepa desde dónde sigue.
export async function estadoInicial(telefono: string): Promise<{
  registrado: boolean;
  paso: EstadoConversacion["paso"];
  salida: MensajeSalida[];
}> {
  const db = supabaseAdmin();
  const { data: tec } = await db
    .from("tecnicos")
    .select("id")
    .eq("telefono", telefono)
    .eq("activo", true)
    .maybeSingle();
  if (!tec) return { registrado: false, paso: "menu", salida: [] };

  const { data: conv } = await db
    .from("conversaciones")
    .select("estado")
    .eq("tecnico_id", tec.id)
    .maybeSingle();
  const estado = conv?.estado as EstadoConversacion | undefined;
  const paso = estado && "paso" in estado ? estado.paso : "menu";

  const salida: MensajeSalida[] =
    paso === "menu" ? [await construirMenuParadas(tec.id, hoyISO())] : [];
  return { registrado: true, paso, salida };
}

export async function enviarAlBot(
  entrada: EntradaSimulada
): Promise<MensajeSalida[]> {
  const salida: MensajeSalida[] = [];
  await procesarMensaje(
    {
      telefono: entrada.telefono,
      texto: entrada.texto,
      interactiveId: entrada.interactiveId,
      imagenMediaId: entrada.imagen ? "sim" : undefined,
    },
    simDeps(salida)
  );
  return salida;
}

// Deja al técnico como recién empezado el día: conversación en el menú y las
// visitas de hoy de vuelta en "asignada" con su checklist en cero. Permite
// re-correr el flujo cuantas veces haga falta sobre los mismos datos.
export async function reiniciarConversacion(tecnicoId: string): Promise<void> {
  const db = supabaseAdmin();
  const fecha = hoyISO();

  await db
    .from("conversaciones")
    .upsert({ tecnico_id: tecnicoId, estado: { paso: "menu" } });

  const { data: visitas, error } = await db
    .from("visitas")
    .select("id")
    .eq("tecnico_id", tecnicoId)
    .eq("fecha", fecha);
  if (error) throw new Error(error.message);

  const ids = (visitas ?? []).map((v) => v.id);
  if (ids.length === 0) return;

  const { error: eVisitas } = await db
    .from("visitas")
    .update({
      estado: "asignada",
      con_observacion: false,
      iniciada_at: null,
      completada_at: null,
    })
    .in("id", ids);
  if (eVisitas) throw new Error(eVisitas.message);

  const { error: eItems } = await db
    .from("visita_items")
    .update({
      estado: "pendiente",
      valor: null,
      motivo: null,
      evidencia_url: null,
      respondido_at: null,
    })
    .in("visita_id", ids);
  if (eItems) throw new Error(eItems.message);
}
