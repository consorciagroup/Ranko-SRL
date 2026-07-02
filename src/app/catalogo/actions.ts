"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ChecklistItem } from "@/lib/types";

export async function crearTipoTrabajo(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;
  const { error } = await supabaseAdmin().from("tipos_trabajo").insert({ nombre });
  if (error) throw new Error(error.message);
  revalidatePath("/catalogo");
}

export async function eliminarTipoTrabajo(formData: FormData) {
  const id = String(formData.get("id"));
  const { error } = await supabaseAdmin()
    .from("tipos_trabajo")
    .update({ activo: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogo");
}

export async function agregarItem(formData: FormData) {
  const tipoTrabajoId = String(formData.get("tipo_trabajo_id"));
  const texto = String(formData.get("texto") ?? "").trim();
  const tipoDato = String(formData.get("tipo_dato"));
  const obligatorio = formData.get("obligatorio") === "on";
  if (!texto) return;

  const db = supabaseAdmin();
  const { data: max } = await db
    .from("checklist_items")
    .select("orden")
    .eq("tipo_trabajo_id", tipoTrabajoId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("checklist_items").insert({
    tipo_trabajo_id: tipoTrabajoId,
    texto,
    tipo_dato: tipoDato,
    obligatorio,
    orden: (max?.orden ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/catalogo/${tipoTrabajoId}`);
}

export async function eliminarItem(formData: FormData) {
  const id = String(formData.get("id"));
  const tipoTrabajoId = String(formData.get("tipo_trabajo_id"));
  const { error } = await supabaseAdmin().from("checklist_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/catalogo/${tipoTrabajoId}`);
}

export async function moverItem(formData: FormData) {
  const id = String(formData.get("id"));
  const tipoTrabajoId = String(formData.get("tipo_trabajo_id"));
  const dir = String(formData.get("dir")); // "arriba" | "abajo"

  const db = supabaseAdmin();
  const { data } = await db
    .from("checklist_items")
    .select("*")
    .eq("tipo_trabajo_id", tipoTrabajoId)
    .order("orden");
  const items = (data ?? []) as ChecklistItem[];

  const idx = items.findIndex((i) => i.id === id);
  const swapIdx = dir === "arriba" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;

  const a = items[idx];
  const b = items[swapIdx];
  await db.from("checklist_items").update({ orden: b.orden }).eq("id", a.id);
  await db.from("checklist_items").update({ orden: a.orden }).eq("id", b.id);
  revalidatePath(`/catalogo/${tipoTrabajoId}`);
}
