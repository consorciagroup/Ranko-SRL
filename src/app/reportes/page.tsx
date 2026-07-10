import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/format";
import type { Direccion, EstadoReporte, Reporte } from "@/lib/types";
import { ESTADO_REPORTE_LABEL } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportesFiltros } from "./ReportesFiltros";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; estado?: string }>;
}) {
  const { fecha: fechaFiltro, estado: estadoFiltro } = await searchParams;

  const db = supabaseAdmin();

  let query = db
    .from("reportes")
    .select("*, direcciones(*)")
    .order("created_at", { ascending: false });
  // El "fecha" filtra por período: reportes cuyo rango incluye ese día.
  if (fechaFiltro) {
    query = query.lte("periodo_desde", fechaFiltro).gte("periodo_hasta", fechaFiltro);
  }
  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const { data: reportesData, error } = await query;
  if (error) throw new Error(error.message);
  const reportesGenerados = (reportesData ?? []) as (Reporte & {
    direcciones: Direccion;
  })[];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Reportes"
        bell
        actions={
          <Link href="/reportes/nuevo">
            <Button>+ Nuevo reporte</Button>
          </Link>
        }
      >
      </PageHeader>

      <ReportesFiltros
        fecha={fechaFiltro}
        estado={estadoFiltro as EstadoReporte | undefined}
        searchPlaceholder="Buscar reporte, dirección o cliente…"
      />

      <div className="mt-6">
        {reportesGenerados.length > 0 ? (
          <div className="overflow-hidden rounded-xl bg-surface hairline">
            {reportesGenerados.map((r) => {
              const rango =
                r.periodo_desde === r.periodo_hasta
                  ? formatFecha(r.periodo_desde)
                  : `${formatFecha(r.periodo_desde)} — ${formatFecha(r.periodo_hasta)}`;
              return (
                <Link
                  key={r.id}
                  href={`/reportes/${r.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 shadow-[inset_0_-1px_0_var(--color-hairline)] transition-colors last:shadow-none hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="font-display font-bold text-ink">
                      {r.titulo}
                      <span className="ml-2 font-normal text-ink-muted">
                        {r.direcciones.direccion}
                      </span>
                    </div>
                    <div className="text-sm text-ink-muted">
                      {r.direcciones.cliente} · {rango}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-2 hairline">
                    {ESTADO_REPORTE_LABEL[r.estado]}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState>
            {fechaFiltro || estadoFiltro
              ? "Sin reportes que coincidan con los filtros aplicados."
              : "Sin reportes generados todavía. Creá el primero desde el botón de arriba."}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
