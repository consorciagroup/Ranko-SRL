"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sanitizarContenido, esContenidoVacio } from "@/lib/richtext";

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

// Sobreescribe el contenido narrativo (título, resumen, cierre) de un reporte
// con el HTML rico del editor. El HTML se sanitiza server-side antes de
// persistir. No se versiona: pisa el contenido anterior.
export async function actualizarReporte(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tituloHtml = sanitizarContenido(String(formData.get("titulo") ?? ""));
  const resumenHtml = sanitizarContenido(String(formData.get("resumen") ?? ""));
  const cierreHtml = sanitizarContenido(String(formData.get("cierre") ?? ""));

  const titulo = esContenidoVacio(tituloHtml)
    ? "Informe de inspección"
    : tituloHtml;
  const resumen = esContenidoVacio(resumenHtml) ? null : resumenHtml;
  const cierre = esContenidoVacio(cierreHtml) ? null : cierreHtml;

  const { error } = await supabaseAdmin()
    .from("reportes")
    .update({ titulo, resumen, cierre })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/reportes");
  revalidatePath(`/reportes/${id}`);
  redirect(`/reportes/${id}`);
}

export async function eliminarReporte(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabaseAdmin().from("reportes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reportes");
  redirect("/reportes");
}
