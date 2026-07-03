"use client";

import { useFormStatus } from "react-dom";

// Submit destructivo con estilo de link (Quitar / Eliminar dentro de un form).
// El rojo de sistema (red-600) queda reservado a lo destructivo; el rojo de
// marca (ranko) queda para primario/acento. Deshabilita mientras corre para
// evitar dobles bajas.
//
// Para bajas que necesitan confirmación (técnico / dirección / tipo de trabajo)
// usar `ConfirmDeleteButton`, que abre un modal propio en vez de enviar directo.
export function DeleteButton({
  children = "Dar de baja",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-sm font-medium text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-50 ${className}`}
    >
      {pending ? "…" : children}
    </button>
  );
}
