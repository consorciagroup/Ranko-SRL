"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "./Button";

// Botón de submit para forms con server actions. Usa useFormStatus para
// deshabilitarse mientras la acción corre: da feedback y evita doble envío
// (importa sobre todo en "Enviar ruta por WhatsApp", que llama a Meta).
export function SubmitButton({
  children,
  pendingText,
  variant,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending ? pendingText ?? "Enviando…" : children}
    </Button>
  );
}
