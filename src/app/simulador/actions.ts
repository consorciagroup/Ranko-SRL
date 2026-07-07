"use server";

import { procesarMensaje } from "@/lib/bot/engine";
import { hoyISO } from "@/lib/bot/menu";
import { simDepsBandeja } from "@/lib/bot/simDeps";
import {
  appendBandeja,
  leerBandeja,
  limpiarBandeja,
} from "@/lib/sim/bandeja";
import type { BandejaMsg } from "@/lib/sim/bandeja";
import { supabaseAdmin } from "@/lib/supabase/server";

// Trae el hilo actual de un técnico. El chat lo pollea para ver llegar los
// mensajes que dispara "Enviar ruta por WhatsApp" desde otra pestaña.
export async function traerBandeja(tecnicoId: string): Promise<BandejaMsg[]> {
  return leerBandeja(tecnicoId);
}

// Un turno del técnico: registra lo que "mandó" y corre el MISMO motor que el
// webhook real; simDepsBandeja persiste la respuesta del bot en el hilo.
export async function enviarComoTecnico(entrada: {
  tecnicoId: string;
  telefono: string;
  texto?: string;
  interactiveId?: string;
  imagen?: boolean;
  // Lo que se muestra como burbuja del técnico (texto tipeado o título del botón)
  etiqueta: string;
}): Promise<BandejaMsg[]> {
  await appendBandeja(entrada.tecnicoId, "tecnico", { texto: entrada.etiqueta });
  await procesarMensaje(
    {
      telefono: entrada.telefono,
      texto: entrada.texto,
      interactiveId: entrada.interactiveId,
      imagenMediaId: entrada.imagen ? "sim" : undefined,
    },
    simDepsBandeja(entrada.tecnicoId)
  );
  return leerBandeja(entrada.tecnicoId);
}

// Deja al técnico como recién empezado el día: conversación en el menú, visitas
// de hoy de vuelta en "asignada" con el checklist en cero, y el hilo vaciado.
export async function reiniciar(tecnicoId: string): Promise<BandejaMsg[]> {
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
  if (ids.length > 0) {
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

  await limpiarBandeja(tecnicoId);
  await appendBandeja(tecnicoId, "sistema", {
    texto: "Conversación y visitas de hoy reiniciadas.",
  });
  return leerBandeja(tecnicoId);
}
