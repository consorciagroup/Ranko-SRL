import { Avatar } from "./Avatar";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

// Tarjeta de técnico (grilla de Técnicos): avatar + nombre + teléfono, con los
// KPIs de "reportes este mes" y "último trabajo" calculados de `visitas`.
//
// NOTA: el diseño original muestra además "especialidad" y un pill de
// "disponibilidad" (Disponible / Fuera de turno). Esos dos campos NO existen
// en el modelo real de `tecnicos` (solo nombre/telefono/activo) — están
// pendientes de decisión de esquema, por eso no se muestran todavía.
export function TechCard({
  id,
  nombre,
  telefono,
  reportesMes,
  ultimoTrabajo,
  eliminar,
}: {
  id: string;
  nombre: string;
  telefono: string;
  reportesMes: number;
  ultimoTrabajo: string | null;
  eliminar: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-xl bg-surface p-5 hairline">
      <div className="flex items-center gap-3">
        <Avatar nombre={nombre} size={44} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold text-ink">{nombre}</div>
          <div className="font-mono text-xs text-ink-muted">{telefono}</div>
        </div>
        <ConfirmDeleteButton
          action={eliminar}
          id={id}
          titulo="Eliminar técnico"
          mensaje={`El técnico "${nombre}" dejará de recibir visitas por WhatsApp. Las visitas ya cargadas no se modifican.`}
        />
      </div>

      <div className="h-px bg-hairline" />

      <div className="flex items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-ink-muted">Reportes este mes</span>
          <span className="font-display text-xl font-bold text-ink">
            {reportesMes}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-ink-muted">Último trabajo</span>
          <span className="text-xs font-medium text-ink">
            {ultimoTrabajo ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
