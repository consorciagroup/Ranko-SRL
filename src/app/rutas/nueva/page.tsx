import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import type { Direccion, Tecnico, TipoTrabajo } from "@/lib/types";
import { RutaWizard } from "./RutaWizard";

export const dynamic = "force-dynamic";

export default async function NuevaRutaPage() {
  const db = supabaseAdmin();
  const [tecnicosRes, direccionesRes, tiposRes] = await Promise.all([
    db.from("tecnicos").select("*").eq("activo", true).order("nombre"),
    db.from("direcciones").select("*").eq("activo", true).order("cliente"),
    db.from("tipos_trabajo").select("*").eq("activo", true).order("nombre"),
  ]);

  const tecnicos = (tecnicosRes.data ?? []) as Tecnico[];
  const direcciones = (direccionesRes.data ?? []) as Direccion[];
  const tipos = (tiposRes.data ?? []) as TipoTrabajo[];

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <Link
          href="/rutas"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Rutas
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
          Armar ruta
        </h1>
        <p className="mt-1 text-base text-ink-muted">
          Cada tipo de trabajo en una dirección genera una visita independiente
          con su propio checklist.
        </p>
      </div>

      <RutaWizard
        fechaDefault={hoyISO()}
        tecnicos={tecnicos}
        direcciones={direcciones}
        tipos={tipos}
      />
    </div>
  );
}
