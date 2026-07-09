import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha, formatHora } from "@/lib/format";
import type { Direccion, TipoTrabajo, Tecnico, Visita, Reporte } from "@/lib/types";
import { ESTADO_REPORTE_LABEL } from "@/lib/types";
import { EstadoBadge } from "@/components/EstadoBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { ReportesFiltros } from "./ReportesFiltros";

export const dynamic = "force-dynamic";

// Un "reporte" es hoy una visita en estado cerrado (completada/en_revision/
// aprobada) — no hay tabla `reportes` dedicada todavía. Tipo local con las
// relaciones embebidas: `VisitaConRelaciones` de types.ts no trae `tecnicos`,
// así que se define acá sin tocar el archivo de tipos compartido.
type ReporteVisita = Visita & {
  direcciones: Direccion;
  tipos_trabajo: TipoTrabajo;
  tecnicos: Tecnico;
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; visita?: string }>;
}) {
  const { fecha: fechaFiltro, visita: visitaId } = await searchParams;

  const db = supabaseAdmin();

  const { data: reportesData } = await db
    .from("reportes")
    .select("*, direcciones(*)")
    .order("created_at", { ascending: false });
  const reportesGenerados = (reportesData ?? []) as (Reporte & {
    direcciones: Direccion;
  })[];

  let query = db
    .from("visitas")
    .select("*, direcciones(*), tipos_trabajo(*), tecnicos(*)")
    .in("estado", ["completada", "en_revision", "aprobada"])
    .order("fecha", { ascending: false });
  if (fechaFiltro) query = query.eq("fecha", fechaFiltro);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const reportes = (data ?? []) as ReporteVisita[];

  const seleccionado = visitaId
    ? reportes.find((r) => r.id === visitaId)
    : undefined;

  const hrefReporte = (id: string) =>
    `?${fechaFiltro ? `fecha=${fechaFiltro}&` : ""}visita=${id}`;

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

      {reportesGenerados.length > 0 && (
        <section className="mt-2">
          <div className="grid gap-3">
            {reportesGenerados.map((r) => {
              const rango =
                r.periodo_desde === r.periodo_hasta
                  ? formatFecha(r.periodo_desde)
                  : `${formatFecha(r.periodo_desde)} — ${formatFecha(r.periodo_hasta)}`;
              return (
                <Link
                  key={r.id}
                  href={`/reportes/${r.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface px-5 py-4 hairline transition-colors hover:bg-black/[0.02]"
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
        </section>
      )}

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">
          Trabajos cerrados
        </h2>
        <ReportesFiltros
          fecha={fechaFiltro}
          searchPlaceholder="Buscar trabajo, cliente o técnico…"
        />
      </div>

      <div className="mt-6 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <div className="grid gap-4">
            {reportes.map((r) => (
              <article
                key={r.id}
                className="relative flex items-center justify-between rounded-xl bg-surface px-5 py-4 hairline"
              >
                <div className="min-w-0">
                  <Link
                    href={hrefReporte(r.id)}
                    scroll={false}
                    className="font-display font-bold text-ink hover:underline"
                  >
                    <span className="absolute inset-0" aria-hidden="true" />
                    {r.direcciones.cliente}
                    <span className="ml-2 font-normal text-ink-muted">
                      {r.tipos_trabajo.nombre}
                    </span>
                  </Link>
                  <div className="text-sm text-ink-muted">
                    {r.tecnicos.nombre} · {formatFecha(r.fecha)}
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-3">
                  <EstadoBadge estado={r.estado} conObservacion={r.con_observacion} />
                </div>
              </article>
            ))}
            {reportes.length === 0 && (
              <EmptyState>
                {fechaFiltro
                  ? `Sin reportes cerrados para el ${formatFecha(fechaFiltro)}.`
                  : "Sin reportes cerrados todavía. Los reportes se generan cuando un técnico completa una visita desde WhatsApp."}
              </EmptyState>
            )}
          </div>
        </div>

        <DetailPanel
          title={seleccionado ? seleccionado.direcciones.cliente : undefined}
          closeHref={fechaFiltro ? `?fecha=${fechaFiltro}` : "?"}
          emptyMessage="Seleccioná un reporte para ver el detalle."
        >
          {seleccionado ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Dirección
                </dt>
                <dd className="text-ink-2">{seleccionado.direcciones.direccion}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Técnico
                </dt>
                <dd className="text-ink-2">{seleccionado.tecnicos.nombre}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Tipo de trabajo
                </dt>
                <dd className="text-ink-2">{seleccionado.tipos_trabajo.nombre}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Fecha
                </dt>
                <dd className="text-ink-2">{formatFecha(seleccionado.fecha)}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Estado
                </dt>
                <dd>
                  <EstadoBadge
                    estado={seleccionado.estado}
                    conObservacion={seleccionado.con_observacion}
                  />
                </dd>
              </div>
              {(seleccionado.iniciada_at || seleccionado.completada_at) && (
                <div className="text-xs text-ink-muted">
                  {seleccionado.iniciada_at && (
                    <>inició {formatHora(seleccionado.iniciada_at)}</>
                  )}
                  {seleccionado.iniciada_at && seleccionado.completada_at && " · "}
                  {seleccionado.completada_at && (
                    <>terminó {formatHora(seleccionado.completada_at)}</>
                  )}
                </div>
              )}
            </dl>
          ) : undefined}
        </DetailPanel>
      </div>
    </div>
  );
}
