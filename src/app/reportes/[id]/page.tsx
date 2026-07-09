import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/format";
import { ESTADO_REPORTE_LABEL } from "@/lib/types";
import type {
  Reporte,
  Direccion,
  Visita,
  TipoTrabajo,
  Tecnico,
  VisitaItem,
  EstadoItem,
} from "@/lib/types";
import { EstadoBadge } from "@/components/EstadoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { eliminarReporte } from "../actions";

export const dynamic = "force-dynamic";

type VisitaFull = Visita & {
  tipos_trabajo: TipoTrabajo;
  tecnicos: Tecnico;
};

// URL pública de una evidencia (bucket `evidencias` es público). Acepta tanto
// un path de storage como una URL absoluta ya resuelta.
function evidenciaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/evidencias/${path}`;
}

// Ícono + color por estado de ítem del checklist.
const ITEM_VISUAL: Record<
  EstadoItem,
  { icon: string; className: string; label: string }
> = {
  completo: {
    icon: "✓",
    className: "bg-estado-completada text-white",
    label: "Completo",
  },
  observacion: {
    icon: "!",
    className: "bg-estado-observacion text-white",
    label: "Observación",
  },
  incompleto: {
    icon: "✕",
    className: "bg-ranko text-white",
    label: "Incompleto",
  },
  pendiente: {
    icon: "·",
    className: "bg-surface-3 text-ink-muted",
    label: "Pendiente",
  },
};

export default async function ReporteDetallePage({
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

  // Meta derivada para el encabezado del informe.
  const totalObs = items.filter(
    (i) => i.estado === "observacion" || i.estado === "incompleto"
  ).length;
  const tecnicos = Array.from(
    new Set(filas.map((f) => f.visitas.tecnicos?.nombre).filter(Boolean))
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Barra de acciones (fuera de la hoja) */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/reportes"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Reportes
        </Link>
        <ConfirmDeleteButton
          action={eliminarReporte}
          id={reporte.id}
          titulo="Eliminar reporte"
          mensaje="Se va a eliminar este reporte de forma permanente. Los trabajos y sus visitas no se tocan."
        />
      </div>

      {/* La hoja del informe */}
      <article className="overflow-hidden rounded-2xl bg-surface hairline">
        <div className="h-1.5 w-full bg-ranko" />

        <div className="p-8 sm:p-10">
          {/* Membrete */}
          <header className="flex items-start justify-between gap-6">
            <Image
              src="/logo-ranko.png"
              alt="Ranko SRL"
              width={180}
              height={47}
              priority
            />
            <div className="text-right text-sm">
              <div className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
                Informe
              </div>
              <div className="mt-1">
                <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-2 hairline">
                  {ESTADO_REPORTE_LABEL[reporte.estado]}
                </span>
              </div>
              <div className="mt-2 text-xs text-ink-muted">
                Emitido {formatFecha(reporte.created_at.slice(0, 10))}
              </div>
            </div>
          </header>

          <div className="my-7 h-px w-full bg-hairline" />

          {/* Portada */}
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink">
            {reporte.titulo}
          </h1>
          <div className="mt-3 text-lg font-semibold text-ink-2">
            {reporte.direcciones.direccion}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <span>{reporte.direcciones.cliente}</span>
            <span aria-hidden>·</span>
            <span>{rango}</span>
          </div>

          {/* Meta chips */}
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-canvas px-3 py-1.5 font-medium text-ink-2 hairline">
              {filas.length} trabajo{filas.length !== 1 && "s"}
            </span>
            {totalObs > 0 && (
              <span className="rounded-full bg-canvas px-3 py-1.5 font-medium text-ink-2 hairline">
                {totalObs} observación{totalObs !== 1 && "es"}
              </span>
            )}
            {tecnicos.length > 0 && (
              <span className="rounded-full bg-canvas px-3 py-1.5 font-medium text-ink-2 hairline">
                {tecnicos.join(" · ")}
              </span>
            )}
          </div>

          {/* Resumen */}
          {reporte.resumen && (
            <section className="mt-8">
              <SectionLabel>Resumen</SectionLabel>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-2">
                {reporte.resumen}
              </p>
            </section>
          )}

          {/* Trabajos */}
          <section className="mt-8">
            <SectionLabel>Trabajos realizados</SectionLabel>

            {filas.length > 0 ? (
              <div className="mt-4 flex flex-col gap-6">
                {filas.map((f, i) => {
                  const v = f.visitas;
                  const its = itemsPorVisita.get(f.visita_id) ?? [];
                  return (
                    <div key={f.visita_id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-xs font-bold text-ink-muted">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <h3 className="font-display text-xl font-bold text-ink">
                              {v.tipos_trabajo?.nombre ?? "—"}
                            </h3>
                          </div>
                          <div className="mt-0.5 text-sm text-ink-muted">
                            {v.tecnicos?.nombre ?? "—"} · {formatFecha(v.fecha)}
                          </div>
                        </div>
                        <EstadoBadge
                          estado={v.estado}
                          conObservacion={v.con_observacion}
                        />
                      </div>

                      {its.length > 0 ? (
                        <ul className="mt-3 overflow-hidden rounded-xl hairline">
                          {its.map((it) => {
                            const vis = ITEM_VISUAL[it.estado];
                            const foto =
                              it.tipo_dato === "foto"
                                ? evidenciaUrl(it.evidencia_url)
                                : null;
                            return (
                              <li
                                key={it.id}
                                className="flex items-start gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
                              >
                                <span
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${vis.className}`}
                                  title={vis.label}
                                >
                                  {vis.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-ink-2">{it.texto}</span>
                                  {it.motivo && (
                                    <div className="mt-0.5 text-xs text-ink-muted">
                                      Motivo: {it.motivo}
                                    </div>
                                  )}
                                  {foto && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={foto}
                                      alt={it.texto}
                                      className="mt-2 h-28 w-28 rounded-lg object-cover hairline"
                                    />
                                  )}
                                </div>
                                {it.valor && it.tipo_dato !== "foto" && (
                                  <span className="shrink-0 font-mono text-sm text-ink">
                                    {it.valor}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-ink-muted">
                          Sin checklist registrado.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState>Este reporte no tiene trabajos asociados.</EmptyState>
              </div>
            )}
          </section>

          {/* Cierre */}
          {reporte.cierre && (
            <section className="mt-8">
              <SectionLabel>Cierre</SectionLabel>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-2">
                {reporte.cierre}
              </p>
            </section>
          )}

          {/* Pie */}
          <footer className="mt-10 border-t border-hairline pt-4 text-xs text-ink-muted">
            Ranko SRL · Ingeniería contra incendios · rankosrl.com.ar
          </footer>
        </div>
      </article>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ranko">
      {children}
    </h2>
  );
}
