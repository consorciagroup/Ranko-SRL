import type { EstadoVisita } from "@/lib/types";
import { ESTADO_VISITA_LABEL } from "@/lib/types";

const ESTADO_COLOR: Record<EstadoVisita, string> = {
  asignada: "bg-neutral-100 text-neutral-600",
  en_curso: "bg-blue-100 text-blue-700",
  completada: "bg-green-100 text-green-700",
  en_revision: "bg-amber-100 text-amber-700",
  aprobada: "bg-emerald-100 text-emerald-800",
  sin_acceso: "bg-red-100 text-red-700",
};

export function EstadoBadge({
  estado,
  conObservacion,
}: {
  estado: EstadoVisita;
  conObservacion?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_COLOR[estado]}`}
      >
        {ESTADO_VISITA_LABEL[estado]}
      </span>
      {conObservacion && (
        <span
          className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700"
          title="Tiene ítems con observación o incompletos"
        >
          ⚠ Obs.
        </span>
      )}
    </span>
  );
}
