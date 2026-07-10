import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha, formatHora } from "@/lib/format";
import { normalizarBusqueda } from "@/lib/busqueda";
import type { Direccion, TipoTrabajo, Tecnico, Visita } from "@/lib/types";
import { EstadoBadge } from "@/components/EstadoBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DetailPanel } from "@/components/ui/DetailPanel";
import Link from "next/link";
import { TrabajosCerradosFiltros } from "./TrabajosCerradosFiltros";

export const dynamic = "force-dynamic";

// Un "trabajo cerrado" es una visita en estado cerrado (completada/en_revision/
// aprobada) — no hay tabla dedicada. Tipo local con las relaciones embebidas:
// `VisitaConRelaciones` de types.ts no trae `tecnicos`, así que se define acá
// sin tocar el archivo de tipos compartido.
type TrabajoCerrado = Visita & {
  direcciones: Direccion;
  tipos_trabajo: TipoTrabajo;
  tecnicos: Tecnico;
};

export default async function TrabajosCerradosPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; visita?: string; q?: string }>;
}) {
  const { fecha: fechaFiltro, visita: visitaId, q } = await searchParams;

  const db = supabaseAdmin();

  let query = db
    .from("visitas")
    .select("*, direcciones(*), tipos_trabajo(*), tecnicos(*)")
    .in("estado", ["completada", "en_revision", "aprobada"])
    .order("fecha", { ascending: false });
  if (fechaFiltro) query = query.eq("fecha", fechaFiltro);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const trabajos = (data ?? []) as TrabajoCerrado[];

  // Búsqueda por texto (cliente / técnico / tipo de trabajo / dirección). El
  // listado ya viene acotado por fecha desde la DB, así que el filtro por `q`
  // se resuelve en memoria sobre esas filas. Insensible a acentos y mayúsculas.
  const termino = normalizarBusqueda((q ?? "").trim());
  const trabajosFiltrados = termino
    ? trabajos.filter((t) =>
        [
          t.direcciones.cliente,
          t.direcciones.direccion,
          t.tecnicos.nombre,
          t.tipos_trabajo.nombre,
        ].some((campo) => campo && normalizarBusqueda(campo).includes(termino))
      )
    : trabajos;

  const seleccionado = visitaId
    ? trabajos.find((t) => t.id === visitaId)
    : undefined;

  // Preserva fecha + búsqueda activas al navegar dentro de la pantalla.
  const hrefCon = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (fechaFiltro) params.set("fecha", fechaFiltro);
    if (q) params.set("q", q);
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  };
  const hrefTrabajo = (id: string) => hrefCon({ visita: id });

  return (
    <div className="max-w-7xl">
      <PageHeader title="Trabajos cerrados" bell>
      </PageHeader>

      <TrabajosCerradosFiltros
        fecha={fechaFiltro}
        q={q}
        searchPlaceholder="Buscar trabajo, cliente o técnico…"
      />

      <div className="mt-6 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          {trabajosFiltrados.length > 0 ? (
            <div className="overflow-hidden rounded-xl bg-surface hairline">
              {trabajosFiltrados.map((t) => (
                <div
                  key={t.id}
                  className="relative flex items-center justify-between px-5 py-4 shadow-[inset_0_-1px_0_var(--color-hairline)] last:shadow-none hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <Link
                      href={hrefTrabajo(t.id)}
                      scroll={false}
                      className="font-display font-bold text-ink hover:underline"
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      {t.direcciones.cliente}
                      <span className="ml-2 font-normal text-ink-muted">
                        {t.tipos_trabajo.nombre}
                      </span>
                    </Link>
                    <div className="text-sm text-ink-muted">
                      {t.tecnicos.nombre} · {formatFecha(t.fecha)}
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-3">
                    <EstadoBadge estado={t.estado} conObservacion={t.con_observacion} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>
              {termino
                ? `Sin trabajos que coincidan con “${q}”.`
                : fechaFiltro
                  ? `Sin trabajos cerrados para el ${formatFecha(fechaFiltro)}.`
                  : "Sin trabajos cerrados todavía. Se generan cuando un técnico completa una visita desde WhatsApp."}
            </EmptyState>
          )}
        </div>

        <DetailPanel
          title={seleccionado ? seleccionado.direcciones.cliente : undefined}
          closeHref={hrefCon({})}
          emptyMessage="Seleccioná un trabajo para ver el detalle."
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
