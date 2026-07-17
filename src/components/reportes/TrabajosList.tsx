import { formatFecha } from "@/lib/format";
import type { Visita, TipoTrabajo, Tecnico, VisitaItem, EstadoItem } from "@/lib/types";
import { EstadoBadge } from "@/components/EstadoBadge";
import { EmptyState } from "@/components/ui/EmptyState";

// Visita con sus relaciones embebidas, tal como llega del join de Supabase en
// las pantallas de reporte. Se exporta para tipar `filas` en la vista final y
// en el editor.
export type VisitaFull = Visita & {
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

// Bloque presentacional de "Trabajos realizados": lista de trabajos con su
// checklist, íconos de estado y fotos de evidencia. Se comparte entre la vista
// final del reporte y el editor, para que ambas se vean idénticas.
export function TrabajosList({
  filas,
  itemsPorVisita,
}: {
  filas: { visita_id: string; orden: number; visitas: VisitaFull }[];
  itemsPorVisita: Map<string, VisitaItem[]>;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ranko">
        Trabajos realizados
      </h2>

      {filas.length > 0 ? (
        <div className="mt-4 flex flex-col gap-6">
          {filas.map((f, i) => {
            const v = f.visitas;
            const its = itemsPorVisita.get(f.visita_id) ?? [];
            return (
              <div key={f.visita_id} className="trabajo-card">
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
  );
}
