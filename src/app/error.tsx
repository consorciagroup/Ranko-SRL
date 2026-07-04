"use client"; // Los error boundaries tienen que ser Client Components

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold text-ink">Algo salió mal</h1>
      <p className="mt-1 text-sm text-ink-muted">
        No se pudo cargar esta sección. Probá de nuevo; si el problema sigue,
        revisá la conexión con la base de datos.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="mt-4 rounded-md bg-ranko px-4 py-2 text-sm font-medium text-white hover:bg-ranko-dark"
      >
        Reintentar
      </button>
    </div>
  );
}
