import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/format";
import { ESTADO_REPORTE_LABEL } from "@/lib/types";
import type { Reporte, Direccion, VisitaItem } from "@/lib/types";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { ExportarPdfButton } from "@/components/ui/ExportarPdfButton";
import { TrabajosList, type VisitaFull } from "@/components/reportes/TrabajosList";
import { contenidoAHtml } from "@/lib/richtext";
import { eliminarReporte } from "../actions";

export const dynamic = "force-dynamic";

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
    <div className="max-w-7xl">
      {/* Barra de acciones (fuera de la hoja) */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          href="/reportes"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Reportes
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/reportes/${id}/editar`}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            Editar
          </Link>
          <ExportarPdfButton />
          <ConfirmDeleteButton
            action={eliminarReporte}
            id={reporte.id}
            titulo="Eliminar reporte"
            mensaje="Se va a eliminar este reporte de forma permanente. Los trabajos y sus visitas no se tocan."
          />
        </div>
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
          <h1
            className="reporte-rico font-display text-4xl font-bold leading-tight tracking-tight text-ink"
            dangerouslySetInnerHTML={{ __html: contenidoAHtml(reporte.titulo) }}
          />
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
              <div
                className="reporte-rico mt-2 leading-relaxed text-ink-2"
                dangerouslySetInnerHTML={{
                  __html: contenidoAHtml(reporte.resumen),
                }}
              />
            </section>
          )}

          {/* Trabajos */}
          <TrabajosList filas={filas} itemsPorVisita={itemsPorVisita} />

          {/* Cierre */}
          {reporte.cierre && (
            <section className="mt-8">
              <SectionLabel>Cierre</SectionLabel>
              <div
                className="reporte-rico mt-2 leading-relaxed text-ink-2"
                dangerouslySetInnerHTML={{
                  __html: contenidoAHtml(reporte.cierre),
                }}
              />
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
