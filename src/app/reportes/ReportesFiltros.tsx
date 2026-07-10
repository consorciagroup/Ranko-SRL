"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";

// Arma el querystring de la pantalla preservando fecha + búsqueda; devuelve "?"
// cuando no hay ninguno para volver al listado completo.
function construirHref(fecha?: string, q?: string) {
  const params = new URLSearchParams();
  if (fecha) params.set("fecha", fecha);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

// Filtros de la sección "Trabajos cerrados": buscador (por cliente / técnico /
// tipo de trabajo / dirección) con debounce que empuja `?q=` a la URL, + filtro
// de día. Ambos preservan el otro parámetro al cambiar.
export function ReportesFiltros({
  fecha,
  q,
  searchPlaceholder,
}: {
  fecha?: string;
  q?: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState(q ?? "");

  // `fecha` vive en un ref para que el debounce use siempre el valor actual sin
  // sumarlo a sus deps (así no se re-dispara al cambiar el día, que ya lo navega
  // el date input). Se sincroniza en un effect: asignar el ref durante el render
  // rompe la regla react-hooks/refs.
  const fechaRef = useRef(fecha);
  useEffect(() => {
    fechaRef.current = fecha;
  }, [fecha]);
  const primeraCarga = useRef(true);

  // Debounce: esperamos 250ms desde la última tecla antes de navegar, así no
  // pegamos una navegación por cada carácter. Usamos `replace` (no `push`) para
  // no llenar el historial con una entrada por letra, y `scroll: false` para
  // que la página no salte al tope al re-renderizar el listado.
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    const t = setTimeout(() => {
      router.replace(construirHref(fechaRef.current, busqueda.trim() || undefined), {
        scroll: false,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [busqueda, router]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <SearchInput
        placeholder={searchPlaceholder}
        defaultValue={q}
        onChange={setBusqueda}
      />
      <label htmlFor="fecha" className="flex flex-col gap-1 text-sm">
        <input
          id="fecha"
          type="date"
          name="fecha"
          key={fecha ?? "todas"}
          defaultValue={fecha}
          onChange={(e) => {
            const value = e.target.value;
            router.push(construirHref(value || undefined, busqueda.trim() || undefined), {
              scroll: false,
            });
          }}
          className="rounded-md border border-hairline bg-surface px-3 py-2 shadow-sm"
        />
      </label>
      {fecha && (
        <Link
          href={construirHref(undefined, q)}
          scroll={false}
          className="pb-2 text-sm text-ink-muted hover:underline"
        >
          Ver todas
        </Link>
      )}
    </div>
  );
}
