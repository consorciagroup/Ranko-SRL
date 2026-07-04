"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enviarMenuParadas, hoyISO } from "@/lib/bot/menu";
import type { ChecklistItem } from "@/lib/types";

// Cada tipo de trabajo seleccionado genera una visita independiente, con el
// checklist snapshoteado al momento de crearla.
export async function agregarParada(formData: FormData) {
  const fecha = String(formData.get("fecha") || hoyISO());
  const tecnicoId = String(formData.get("tecnico_id"));
  const direccionIds = formData.getAll("direcciones").map(String);
  if (!tecnicoId || direccionIds.length === 0) return;

  const pares: { direccionId: string; tipoTrabajoId: string }[] = [];
  for (const direccionId of direccionIds) {
    const tiposDeEstaDireccion = formData.getAll(`tipos_${direccionId}`).map(String);
    for (const tipoTrabajoId of tiposDeEstaDireccion) {
      pares.push({ direccionId, tipoTrabajoId });
    }
  }
  if (pares.length === 0) return;

  const db = supabaseAdmin();

  const { data: max } = await db
    .from("visitas")
    .select("orden")
    .eq("tecnico_id", tecnicoId)
    .eq("fecha", fecha)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  let orden = (max?.orden ?? 0) + 1;

  for (const { direccionId, tipoTrabajoId } of pares) {
    const { data: visita, error } = await db
      .from("visitas")
      .insert({
        fecha,
        tecnico_id: tecnicoId,
        direccion_id: direccionId,
        tipo_trabajo_id: tipoTrabajoId,
        orden: orden++,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { data: itemsData, error: itemsError } = await db
      .from("checklist_items")
      .select("*")
      .eq("tipo_trabajo_id", tipoTrabajoId)
      .order("orden");
    if (itemsError) throw new Error(itemsError.message);

    const snapshot = ((itemsData ?? []) as ChecklistItem[]).map((item) => ({
      visita_id: visita.id,
      checklist_item_id: item.id,
      orden: item.orden,
      texto: item.texto,
      tipo_dato: item.tipo_dato,
      obligatorio: item.obligatorio,
    }));
    if (snapshot.length > 0) {
      const { error: snapError } = await db.from("visita_items").insert(snapshot);
      if (snapError) throw new Error(snapError.message);
    }
  }

  revalidatePath("/rutas");
  // El wizard (/rutas/nueva) es el único que dispara esta action; al terminar
  // volvemos al listado, donde se ve la ruta armada y se envía por WhatsApp.
  redirect("/rutas");
}

export async function eliminarVisita(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Solo se pueden sacar visitas que el técnico no arrancó
  const { error } = await supabaseAdmin()
    .from("visitas")
    .delete()
    .eq("id", id)
    .eq("estado", "asignada");
  if (error) throw new Error(error.message);
  revalidatePath("/rutas");
}

export async function enviarRuta(formData: FormData) {
  const tecnicoId = String(formData.get("tecnico_id") ?? "");
  const fecha = String(formData.get("fecha") || hoyISO());
  if (!tecnicoId) return;

  const db = supabaseAdmin();
  const { data: tecnico, error } = await db
    .from("tecnicos")
    .select("*")
    .eq("id", tecnicoId)
    .single();
  if (error) throw new Error(error.message);

  // Arranca (o reinicia) la conversación del técnico en el paso "menu"
  const { error: convError } = await db
    .from("conversaciones")
    .upsert({ tecnico_id: tecnicoId, estado: { paso: "menu" } });
  if (convError) throw new Error(convError.message);

  await enviarMenuParadas(
    tecnico.telefono,
    tecnicoId,
    fecha,
    `Hola ${tecnico.nombre.split(" ")[0]} 👋 Te llegó la ruta del día.`
  );
  revalidatePath("/rutas");
}
