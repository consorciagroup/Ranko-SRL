"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";

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
  trigger = "Dar de baja",
  confirmLabel = "Dar de baja",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  titulo: string;
  mensaje: string;
  trigger?: string;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
      >
        {trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 text-left shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
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
                  id="confirm-delete-title"
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
                <ConfirmSubmit label={confirmLabel} />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Botón de confirmación: usa useFormStatus para deshabilitarse mientras la
// server action corre (feedback + evita doble baja).
function ConfirmSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? "Dando de baja…" : label}
    </Button>
  );
}
