import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha, formatHora } from "@/lib/format";
import type { Direccion, Tecnico, TipoTrabajo, VisitaConRelaciones } from "@/lib/types";
import { EstadoBadge } from "@/components/EstadoBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { RutasFiltros } from "./RutasFiltros";
import { agruparEnRutas } from "./agrupar";
import { eliminarVisita, enviarRuta } from "./actions";
import { EditarRutaModal } from "./EditarRutaModal";

export const dynamic = "force-dynamic";

export default async function RutasPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; tecnico?: string; ruta?: string }>;
}) {
  const { fecha: fechaFiltro, tecnico: tecnicoId, ruta: rutaFecha } = await searchParams;

  const db = supabaseAdmin();
  let visitasQuery = db
    .from("visitas")
    .select("*, direcciones(*), tipos_trabajo(*)")
    .order("fecha", { ascending: true })
    .order("orden", { ascending: true });
  if (fechaFiltro) visitasQuery = visitasQuery.eq("fecha", fechaFiltro);

  const [tecnicosRes, visitasRes, direccionesRes, tiposRes] = await Promise.all([
    db.from("tecnicos").select("*").eq("activo", true).order("nombre"),
    visitasQuery,
    db.from("direcciones").select("*").eq("activo", true).order("cliente"),
    db.from("tipos_trabajo").select("*").eq("activo", true).order("nombre"),
  ]);
  const tecnicos = (tecnicosRes.data ?? []) as Tecnico[];
  const visitas = (visitasRes.data ?? []) as VisitaConRelaciones[];
  const direcciones = (direccionesRes.data ?? []) as Direccion[];
  const tipos = (tiposRes.data ?? []) as TipoTrabajo[];

  // Todas las visitas de cada técnico (cualquier fecha, ya vienen ordenadas
  // por fecha y orden desde la consulta) — alimenta el panel de detalle.
  const porTecnico = new Map<string, VisitaConRelaciones[]>();
  for (const v of visitas) {
    const grupo = porTecnico.get(v.tecnico_id) ?? [];
    grupo.push(v);
    porTecnico.set(v.tecnico_id, grupo);
  }

  const grupos = agruparEnRutas(tecnicos, visitas);

  const tecnicoSeleccionado = tecnicoId
    ? tecnicos.find((t) => t.id === tecnicoId)
    : undefined;
  // El panel muestra solo la ruta del día que se clickeó, no todas las del técnico.
  const paradasSeleccionadas =
    tecnicoSeleccionado && rutaFecha
      ? (porTecnico.get(tecnicoSeleccionado.id) ?? []).filter(
          (v) => v.fecha === rutaFecha
        )
      : [];

  const hrefTecnico = (id: string, fecha: string) =>
    `?${fechaFiltro ? `fecha=${fechaFiltro}&` : ""}tecnico=${id}&ruta=${fecha}`;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Rutas"
        bell
        actions={
          <Link
            href="/rutas/nueva"
            className="inline-flex items-center rounded-lg bg-ranko px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-ranko-dark"
          >
            + Nueva ruta
          </Link>
        }
      >
      </PageHeader>

      <RutasFiltros
        fecha={fechaFiltro}
        searchPlaceholder="Buscar técnico o cliente…"
      />

      <div className="mt-6 flex items-start gap-6">
      <div className="min-w-0 flex-1">
      {/* Rutas por técnico y fecha, todas juntas en un mismo listado */}
      {grupos.length > 0 ? (
        <div className="grid grid-cols-[max-content_max-content_1fr] overflow-hidden rounded-xl bg-surface hairline">
          {grupos.map((g) => (
            <div
              key={`${g.tecnico.id}-${g.fecha}`}
              className="relative col-span-3 grid grid-cols-subgrid items-center px-5 py-3.5 shadow-[inset_0_-1px_0_var(--color-hairline)] last:shadow-none hover:bg-black/[0.02]"
            >
              <div className="whitespace-nowrap">
                <Link
                  href={hrefTecnico(g.tecnico.id, g.fecha)}
                  scroll={false}
                  className="font-display font-bold text-ink hover:underline"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  {g.tecnico.nombre}
                </Link>
              </div>
              <div className="whitespace-nowrap pl-2 text-sm text-ink-muted">
                {formatFecha(g.fecha)}
              </div>
              <div className="relative z-10 flex items-center justify-end gap-3">
                <Link
                  href={`/simulador/${g.tecnico.id}`}
                  target="_blank"
                  className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
                >
                  Abrir simulador ↗
                </Link>
                <form action={enviarRuta}>
                  <input type="hidden" name="tecnico_id" value={g.tecnico.id} />
                  <input type="hidden" name="fecha" value={g.fecha} />
                  <SubmitButton variant="success" pendingText="Enviando…">
                    Enviar ruta por WhatsApp
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>
          {fechaFiltro
            ? `Sin visitas para el ${formatFecha(fechaFiltro)}. Agregá la primera parada arriba.`
            : "Sin visitas cargadas todavía. Agregá la primera parada arriba."}
        </EmptyState>
      )}
      </div>

      <DetailPanel
        title={
          tecnicoSeleccionado
            ? `Ruta de ${tecnicoSeleccionado.nombre}`
            : undefined
        }
        closeHref={fechaFiltro ? `?fecha=${fechaFiltro}` : "?"}
        emptyMessage="Seleccioná un técnico para ver el orden de sus paradas."
        actions={
          tecnicoSeleccionado && rutaFecha ? (
            <EditarRutaModal
              tecnicoId={tecnicoSeleccionado.id}
              fecha={rutaFecha}
              tecnicoNombre={tecnicoSeleccionado.nombre}
              paradas={paradasSeleccionadas.map((v) => ({
                id: v.id,
                direccion: v.direcciones.direccion,
                cliente: v.direcciones.cliente,
                tipoTrabajo: v.tipos_trabajo.nombre,
                estado: v.estado,
              }))}
              direcciones={direcciones}
              tipos={tipos}
            />
          ) : undefined
        }
      >
        {tecnicoSeleccionado && rutaFecha ? (
          paradasSeleccionadas.length > 0 ? (
            <ol className="space-y-3">
              {paradasSeleccionadas.map((v, i) => (
                <li key={v.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-ink-muted hairline">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="text-sm font-medium text-ink-2">
                          {v.direcciones.direccion}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {v.tipos_trabajo.nombre}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {v.direcciones.cliente}
                        </div>
                        {v.direcciones.notas && (
                          <div className="text-xs text-ink-muted">
                            {v.direcciones.notas}
                          </div>
                        )}
                      </div>
                      {v.estado === "asignada" && (
                        <form action={eliminarVisita}>
                          <input type="hidden" name="id" value={v.id} />
                          <DeleteButton>Quitar</DeleteButton>
                        </form>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <EstadoBadge
                        estado={v.estado}
                        conObservacion={v.con_observacion}
                      />
                    </div>
                    {(v.iniciada_at || v.completada_at) && (
                      <div className="mt-1 text-xs text-ink-muted">
                        {v.iniciada_at && <>inició {formatHora(v.iniciada_at)}</>}
                        {v.iniciada_at && v.completada_at && " · "}
                        {v.completada_at && (
                          <>terminó {formatHora(v.completada_at)}</>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">
              Sin paradas para este técnico.
            </p>
          )
        ) : undefined}
      </DetailPanel>
      </div>
    </div>
  );
}
