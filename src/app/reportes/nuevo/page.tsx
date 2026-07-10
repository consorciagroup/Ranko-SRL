import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import type { Direccion, Visita, TipoTrabajo, Tecnico } from "@/lib/types";
import { ReporteWizard, type VisitaCerrada } from "./ReporteWizard";

export const dynamic = "force-dynamic";

// Estados que cuentan como "trabajo cerrado" y por lo tanto reportable.
const ESTADOS_CERRADOS = ["completada", "en_revision", "aprobada"] as const;

export default async function NuevoReportePage() {
  const db = supabaseAdmin();

  const [direccionesRes, visitasRes] = await Promise.all([
    db.from("direcciones").select("*").eq("activo", true).order("cliente"),
    db
      .from("visitas")
      .select("*, direcciones(*), tipos_trabajo(*), tecnicos(*)")
      .in("estado", ESTADOS_CERRADOS)
      .order("fecha", { ascending: false }),
  ]);

  const direcciones = (direccionesRes.data ?? []) as Direccion[];
  const visitas = ((visitasRes.data ?? []) as (Visita & {
    direcciones: Direccion;
    tipos_trabajo: TipoTrabajo;
    tecnicos: Tecnico;
  })[]).map<VisitaCerrada>((v) => ({
    id: v.id,
    direccion_id: v.direccion_id,
    fecha: v.fecha,
    estado: v.estado,
    con_observacion: v.con_observacion,
    tipo_trabajo: v.tipos_trabajo?.nombre ?? "—",
    tecnico: v.tecnicos?.nombre ?? "—",
  }));

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <Link
          href="/reportes"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Reportes
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
          Nuevo reporte
        </h1>
        <p className="mt-1 text-base text-ink-muted">
          Elegí una dirección y un período: el reporte agrupa todos los trabajos
          cerrados de esa dirección en ese rango de fechas.
        </p>
      </div>

      <ReporteWizard
        hoy={hoyISO()}
        direcciones={direcciones}
        visitas={visitas}
      />
    </div>
  );
}
