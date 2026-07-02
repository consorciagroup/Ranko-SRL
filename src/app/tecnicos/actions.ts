"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function crearTecnico(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  // Normalizamos al formato que usa Meta en los webhooks: E.164 sin '+'
  const telefono = String(formData.get("telefono") ?? "").replace(/[^\d]/g, "");
  if (!nombre || !telefono) return;

  const { error } = await supabaseAdmin()
    .from("tecnicos")
    .insert({ nombre, telefono });
  if (error) throw new Error(error.message);
  revalidatePath("/tecnicos");
}

export async function eliminarTecnico(formData: FormData) {
  const id = String(formData.get("id"));
  // Baja lógica: las visitas históricas siguen referenciando al técnico
  const { error } = await supabaseAdmin()
    .from("tecnicos")
    .update({ activo: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tecnicos");
}
