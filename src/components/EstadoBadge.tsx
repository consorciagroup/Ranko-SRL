import type { EstadoVisita } from "@/lib/types";
import { ESTADO_VISITA_LABEL } from "@/lib/types";

// Pills de estado sólidas (fill + texto blanco), no pastel — por feedback
// directo del diseño: colores más fuertes para una herramienta usada bajo
// presión de tiempo. Espeja ESTADO_VISITA_LABEL de src/lib/types.ts.
const ESTADO_COLOR: Record<EstadoVisita, string> = {
  asignada: "bg-estado-asignada",
  en_curso: "bg-estado-encurso",
  completada: "bg-estado-completada",
  en_revision: "bg-estado-revision",
  aprobada: "bg-estado-aprobada",
  sin_acceso: "bg-estado-sinacceso",
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
        className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${ESTADO_COLOR[estado]}`}
      >
        {ESTADO_VISITA_LABEL[estado]}
      </span>
      {conObservacion && (
        <span
          className="rounded-full bg-estado-observacion px-2.5 py-1 text-xs font-semibold text-white"
          title="Tiene ítems con observación o incompletos"
        >
          ⚠ Obs.
        </span>
      )}
    </span>
  );
}
