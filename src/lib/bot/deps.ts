import { supabaseAdmin } from "@/lib/supabase/server";
import { downloadMedia, sendButtons, sendText } from "@/lib/whatsapp";
import type { EstadoConversacion, Tecnico, VisitaItem } from "@/lib/types";
import type { BotDeps } from "./engine";
import { enviarMenuParadas, hoyISO, visitasPendientesDe } from "./menu";
import type { VisitaConRelaciones } from "./menu";

// Implementación real de BotDeps: Supabase + Meta Cloud API.
export function realDeps(): BotDeps {
  const db = supabaseAdmin();

  return {
    hoy: hoyISO,

    async getTecnico(telefono: string): Promise<Tecnico | null> {
      const { data } = await db
        .from("tecnicos")
        .select("*")
        .eq("telefono", telefono)
        .eq("activo", true)
        .maybeSingle();
      return data as Tecnico | null;
    },

    async getEstado(tecnicoId: string): Promise<EstadoConversacion> {
      const { data } = await db
        .from("conversaciones")
        .select("estado")
        .eq("tecnico_id", tecnicoId)
        .maybeSingle();
      const estado = data?.estado as EstadoConversacion | undefined;
      return estado && "paso" in estado ? estado : { paso: "menu" };
    },

    async setEstado(tecnicoId: string, estado: EstadoConversacion): Promise<void> {
      const { error } = await db
        .from("conversaciones")
        .upsert({ tecnico_id: tecnicoId, estado });
      if (error) throw new Error(error.message);
    },

    visitasPendientes: visitasPendientesDe,

    async getVisita(id: string): Promise<VisitaConRelaciones | null> {
      const { data } = await db
        .from("visitas")
        .select("*, direcciones(*), tipos_trabajo(*)")
        .eq("id", id)
        .maybeSingle();
      return data as VisitaConRelaciones | null;
    },

    async actualizarVisita(id: string, patch: Record<string, unknown>): Promise<void> {
      const { error } = await db.from("visitas").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },

    async itemsDe(visitaId: string): Promise<VisitaItem[]> {
      const { data, error } = await db
        .from("visita_items")
        .select("*")
        .eq("visita_id", visitaId)
        .order("orden");
      if (error) throw new Error(error.message);
      return (data ?? []) as VisitaItem[];
    },

    async actualizarItem(id: string, patch: Record<string, unknown>): Promise<void> {
      const { error } = await db.from("visita_items").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },

    async guardarEvidencia(
      mediaId: string,
      visitaId: string,
      itemId: string
    ): Promise<string> {
      const { data, mimeType } = await downloadMedia(mediaId);
      const ext = mimeType.split("/")[1]?.split(";")[0] ?? "jpg";
      const path = `${visitaId}/${itemId}-${Date.now()}.${ext}`;

      const { error } = await db.storage
        .from("evidencias")
        .upload(path, data, { contentType: mimeType, upsert: true });
      if (error) throw new Error(error.message);

      return db.storage.from("evidencias").getPublicUrl(path).data.publicUrl;
    },

    enviarTexto: sendText,
    enviarBotones: sendButtons,
    enviarMenu: enviarMenuParadas,
  };
}
