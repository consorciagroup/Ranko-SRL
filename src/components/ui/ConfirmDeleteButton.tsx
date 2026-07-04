"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";
import { Modal } from "./Modal";

// Baja con confirmación mediante un modal propio del panel (no el confirm()
// nativo del navegador, que muestra el dominio y no se puede estilar).
//
// El <form action={...}> con la server action vive DENTRO del modal, así que la
// baja solo se dispara al confirmar. La server action se recibe como prop desde
// el server component (patrón soportado por Next.js App Router).
export function ConfirmDeleteButton({
  action,
  id,
  titulo,
  mensaje,
  trigger = "Eliminar",
  confirmLabel = "Eliminar",
  pendingLabel = "Eliminando…",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  titulo: string;
  mensaje: string;
  trigger?: string;
  confirmLabel?: string;
  pendingLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
      >
        {trigger}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div className="flex gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  id={titleId}
                  className="text-xl font-bold text-neutral-900"
                >
                  {titulo}
                </h2>
                <p className="mt-1 text-base text-neutral-600">{mensaje}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                autoFocus
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <form action={action}>
                <input type="hidden" name="id" value={id} />
                <ConfirmSubmit label={confirmLabel} pendingLabel={pendingLabel} />
              </form>
            </div>
      </Modal>
    </>
  );
}

// Botón de confirmación: usa useFormStatus para deshabilitarse mientras la
// server action corre (feedback + evita doble baja).
function ConfirmSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
