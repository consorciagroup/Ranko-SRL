"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function crearDireccion(formData: FormData) {
  const direccion = String(formData.get("direccion") ?? "").trim();
  const cliente = String(formData.get("cliente") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim() || null;
  if (!direccion || !cliente) return;

  const { error } = await supabaseAdmin()
    .from("direcciones")
    .insert({ direccion, cliente, notas });
  if (error) throw new Error(error.message);
  revalidatePath("/direcciones");
}

export async function eliminarDireccion(formData: FormData) {
  const id = String(formData.get("id"));
  const { error } = await supabaseAdmin()
    .from("direcciones")
    .update({ activo: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/direcciones");
}
