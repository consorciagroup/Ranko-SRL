"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";

// Filtros de la pantalla Rutas: buscador (decorativo, todavía sin cablear —
// ver SearchInput) + filtro de día que se aplica solo al cambiar el input
// (onChange → router.push), sin botón de submit. Va debajo del título.
export function RutasFiltros({
  fecha,
  searchPlaceholder,
}: {
  fecha?: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <SearchInput placeholder={searchPlaceholder} />
      <label htmlFor="fecha" className="flex flex-col gap-1 text-sm">
        <input
          id="fecha"
          type="date"
          name="fecha"
          key={fecha ?? "todas"}
          defaultValue={fecha}
          onChange={(e) => {
            const value = e.target.value;
            router.push(value ? `?fecha=${value}` : "?");
          }}
          className="rounded-md border border-hairline bg-surface px-3 py-2 shadow-sm"
        />
      </label>
      {fecha && (
        <Link
          href="?"
          scroll={false}
          className="pb-2 text-sm text-ink-muted hover:underline"
        >
          Ver todas
        </Link>
      )}
    </div>
  );
}
