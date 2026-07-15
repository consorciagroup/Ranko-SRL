"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { EditarTecnicoModal, type TrabajoReciente } from "./EditarTecnicoModal";

// Tarjeta de técnico (grilla de Técnicos): avatar + nombre + teléfono, con los
// KPIs de "reportes este mes" y "último trabajo" calculados de `visitas`. Al
// presionarla abre un modal para editar nombre/teléfono y ver los últimos
// trabajos realizados.
//
// NOTA: el diseño original muestra además "especialidad" y un pill de
// "disponibilidad" (Disponible / Fuera de turno). Esos dos campos NO existen
// en el modelo real de `tecnicos` (solo nombre/telefono/activo), así que la
// tarjeta muestra el teléfono en su lugar y reserva la esquina superior derecha
// (donde iría el pill) para la acción Eliminar, oculta hasta hover/foco.
export function TechCard({
  id,
  nombre,
  telefono,
  reportesMes,
  ultimoTrabajo,
  trabajosRecientes,
  eliminar,
  editar,
}: {
  id: string;
  nombre: string;
  telefono: string;
  reportesMes: number;
  ultimoTrabajo: string | null;
  trabajosRecientes: TrabajoReciente[];
  eliminar: (formData: FormData) => void | Promise<void>;
  editar: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="group relative flex cursor-pointer flex-col gap-3.5 rounded-xl bg-surface p-5 text-left hairline transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ranko/40"
      >
        <div className="flex items-center gap-3">
          <Avatar nombre={nombre} size={44} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold text-ink">{nombre}</div>
            <div className="font-mono text-xs text-ink-muted">{telefono}</div>
          </div>
        </div>

        {/* El diseño reserva la esquina superior derecha para el pill de estado;
            como no tenemos ese dato, la usamos para Eliminar, que se revela al
            pasar el mouse o al enfocar con teclado para no ensuciar la tarjeta.
            stopPropagation evita que el click en Eliminar también abra el modal
            de edición de la tarjeta. */}
        <div
          className="absolute right-4 top-4 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
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

      <EditarTecnicoModal
        open={open}
        onClose={() => setOpen(false)}
        id={id}
        nombre={nombre}
        telefono={telefono}
        trabajosRecientes={trabajosRecientes}
        action={editar}
      />
    </>
  );
}
