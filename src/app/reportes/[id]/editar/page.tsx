import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/format";
import type { Reporte, Direccion, VisitaItem } from "@/lib/types";
import { ReporteEditor } from "@/components/reportes/ReporteEditor";
import type { VisitaFull } from "@/components/reportes/TrabajosList";

export const dynamic = "force-dynamic";

export default async function ReporteEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: reporteData } = await db
    .from("reportes")
    .select("*, direcciones(*)")
    .eq("id", id)
    .maybeSingle();
  if (!reporteData) notFound();
  const reporte = reporteData as Reporte & { direcciones: Direccion };

  const { data: rvData } = await db
    .from("reporte_visitas")
    .select("visita_id, orden, visitas(*, tipos_trabajo(*), tecnicos(*))")
    .eq("reporte_id", id)
    .order("orden");

  // El embed `visitas(...)` es to-one, pero el cliente sin tipar lo infiere como
  // array — se castea vía unknown a la forma real.
  const filas = (rvData ?? []) as unknown as {
    visita_id: string;
    orden: number;
    visitas: VisitaFull;
  }[];
  const visitaIds = filas.map((f) => f.visita_id);

  const { data: itemsData } = await db
    .from("visita_items")
    .select("*")
    .in("visita_id", visitaIds.length > 0 ? visitaIds : ["__none__"])
    .order("orden");
  const items = (itemsData ?? []) as VisitaItem[];
  const itemsPorVisita = new Map<string, VisitaItem[]>();
  for (const it of items) {
    const arr = itemsPorVisita.get(it.visita_id) ?? [];
    arr.push(it);
    itemsPorVisita.set(it.visita_id, arr);
  }

  const rango =
    reporte.periodo_desde === reporte.periodo_hasta
      ? formatFecha(reporte.periodo_desde)
      : `${formatFecha(reporte.periodo_desde)} — ${formatFecha(reporte.periodo_hasta)}`;

  const totalObs = items.filter(
    (i) => i.estado === "observacion" || i.estado === "incompleto",
  ).length;
  const tecnicos = Array.from(
    new Set(
      filas
        .map((f) => f.visitas.tecnicos?.nombre)
        .filter((n): n is string => Boolean(n)),
    ),
  );

  return (
    <div className="max-w-7xl">
      <ReporteEditor
        reporte={reporte}
        direccion={reporte.direcciones}
        filas={filas}
        itemsPorVisita={itemsPorVisita}
        rango={rango}
        totalObs={totalObs}
        tecnicos={tecnicos}
      />
    </div>
  );
}
