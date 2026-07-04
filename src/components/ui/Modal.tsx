"use client";

import { useEffect } from "react";

// Shell genérico de modal. Concentra el overlay, el foco/scroll-lock y el cierre
// con Escape en un solo lugar (antes vivía inline en ConfirmDeleteButton).
//
// Cuando `!open` retorna null, lo que desmonta todo el subárbol de children —
// incluyendo su estado local. Es intencional: así el form/estado se resetea solo
// cada vez que se cierra el modal.
export function Modal({
  open,
  onClose,
  labelledBy,
  contentClassName = "max-w-md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className={`w-full rounded-xl bg-white p-6 text-left shadow-xl ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
