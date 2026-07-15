"use client";

import { useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type TrabajoReciente = { fecha: string; cliente: string; tipoTrabajo: string };

// Modal de edición de un técnico: nombre + teléfono (editables) y los últimos
// trabajos realizados (solo lectura). Se abre desde TechCard al presionar la
// tarjeta; el estado open/onClose lo controla ese componente.
export function EditarTecnicoModal({
  open,
  onClose,
  id,
  nombre,
  telefono,
  trabajosRecientes,
  action,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  nombre: string;
  telefono: string;
  trabajosRecientes: TrabajoReciente[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} contentClassName="max-w-md">
      <h2 id={titleId} className="text-xl font-bold text-neutral-900">
        Editar técnico
      </h2>

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="id" value={id} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            name="nombre"
            required
            defaultValue={nombre}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Teléfono (WhatsApp)</span>
          <input
            name="telefono"
            required
            defaultValue={telefono}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2"
          />
        </label>

        <div className="border-t border-hairline pt-4">
          <h3 className="text-sm font-semibold text-ink-2">Últimos trabajos</h3>
          {trabajosRecientes.length > 0 ? (
            <ul className="mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto">
              {trabajosRecientes.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{t.cliente}</div>
                    <div className="truncate text-xs text-ink-muted">{t.tipoTrabajo}</div>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">{t.fecha}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Sin trabajos registrados todavía.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <GuardarSubmit onSuccess={onClose} />
        </div>
      </form>
    </Modal>
  );
}

// Botón de guardado: usa useFormStatus para deshabilitarse mientras la server
// action corre, y dispara onSuccess cuando `pending` pasa de true a false.
function GuardarSubmit({ onSuccess }: { onSuccess: () => void }) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) onSuccess();
    wasPending.current = pending;
  }, [pending, onSuccess]);

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar cambios"}
    </Button>
  );
}
