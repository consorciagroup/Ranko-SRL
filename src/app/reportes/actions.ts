"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";

// Crea un reporte para una dirección + período, snapshoteando qué visitas
// entran (las que el wizard dejó seleccionadas). El vínculo queda fijo: borrar
// o reasignar una visita después no altera el reporte ya generado.
export async function crearReporte(formData: FormData) {
  const direccionId = String(formData.get("direccion_id") ?? "");
  const desde = String(formData.get("periodo_desde") ?? "");
  const hasta = String(formData.get("periodo_hasta") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim() || "Informe de inspección";
  const resumen = String(formData.get("resumen") ?? "").trim() || null;
  const cierre = String(formData.get("cierre") ?? "").trim() || null;
  const visitaIds = formData.getAll("visitas").map(String).filter(Boolean);

  if (!direccionId || !desde || !hasta) return;

  const db = supabaseAdmin();

  const { data: reporte, error } = await db
    .from("reportes")
    .insert({
      direccion_id: direccionId,
      titulo,
      periodo_desde: desde,
      periodo_hasta: hasta,
      resumen,
      cierre,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (visitaIds.length > 0) {
    const filas = visitaIds.map((visitaId, i) => ({
      reporte_id: reporte.id,
      visita_id: visitaId,
      orden: i,
    }));
    const { error: rvError } = await db.from("reporte_visitas").insert(filas);
    if (rvError) throw new Error(rvError.message);
  }

  revalidatePath("/reportes");
  redirect(`/reportes/${reporte.id}`);
}

export async function eliminarReporte(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabaseAdmin().from("reportes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reportes");
  redirect("/reportes");
}
