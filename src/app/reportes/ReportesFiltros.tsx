"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";
import { ESTADO_REPORTE_LABEL } from "@/lib/types";
import type { EstadoReporte } from "@/lib/types";

// Filtros de la pantalla Reportes: buscador (decorativo, todavía sin cablear —
// ver SearchInput) + filtro de día (contra el período del reporte) + filtro de
// estado (borrador/finalizado — hoy todos los reportes se crean en borrador,
// pero el filtro ya queda armado para cuando exista el flujo de finalizar).
// Cada input dispara su propio router.push, preservando el otro filtro activo.
export function ReportesFiltros({
  fecha,
  estado,
  searchPlaceholder,
}: {
  fecha?: string;
  estado?: EstadoReporte;
  searchPlaceholder?: string;
}) {
  const router = useRouter();

  function actualizar(next: { fecha?: string; estado?: string }) {
    const params = new URLSearchParams();
    const f = next.fecha !== undefined ? next.fecha : fecha;
    const e = next.estado !== undefined ? next.estado : estado;
    if (f) params.set("fecha", f);
    if (e) params.set("estado", e);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  const hayFiltros = Boolean(fecha || estado);

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
          onChange={(e) => actualizar({ fecha: e.target.value })}
          className="rounded-md border border-hairline bg-surface px-3 py-2 shadow-sm"
        />
      </label>
      <label htmlFor="estado" className="flex flex-col gap-1 text-sm">
        <select
          id="estado"
          name="estado"
          key={estado ?? "todos"}
          defaultValue={estado ?? ""}
          onChange={(e) => actualizar({ estado: e.target.value })}
          className="rounded-md border border-hairline bg-surface px-3 py-2 shadow-sm"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">{ESTADO_REPORTE_LABEL.borrador}</option>
          <option value="finalizado">{ESTADO_REPORTE_LABEL.finalizado}</option>
        </select>
      </label>
      {hayFiltros && (
        <Link
          href="?"
          scroll={false}
          className="pb-2 text-sm text-ink-muted hover:underline"
        >
          Ver todos
        </Link>
      )}
    </div>
  );
}
