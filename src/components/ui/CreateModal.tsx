"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "./Button";
import { Modal } from "./Modal";

// Modal de alta genérico. Reemplaza los forms inline de alta que antes vivían
// arriba de cada listado. El <form action={...}> con la server action vive
// DENTRO del modal; al terminar sin error, el modal se cierra solo.
export function CreateModal({
  trigger,
  title,
  submitLabel,
  pendingLabel = "Creando…",
  action,
  children,
  triggerVariant = "primary",
  contentClassName,
}: {
  trigger: string;
  title: string;
  submitLabel: string;
  pendingLabel?: string;
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  triggerVariant?: ButtonVariant;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setOpen(true)}>
        {trigger}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        contentClassName={contentClassName}
      >
        <h2 id={titleId} className="text-xl font-bold text-neutral-900">
          {title}
        </h2>
        <form action={action} className="mt-4 space-y-4">
          {children}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <CreateSubmit
              label={submitLabel}
              pendingLabel={pendingLabel}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}

// Botón de envío: usa useFormStatus para deshabilitarse mientras la server
// action corre, y dispara onSuccess cuando `pending` pasa de true a false.
function CreateSubmit({
  label,
  pendingLabel,
  onSuccess,
}: {
  label: string;
  pendingLabel: string;
  onSuccess: () => void;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) onSuccess();
    wasPending.current = pending;
  }, [pending, onSuccess]);

  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
