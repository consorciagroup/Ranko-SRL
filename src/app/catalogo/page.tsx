import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { TipoTrabajo } from "@/lib/types";
import { crearTipoTrabajo, eliminarTipoTrabajo } from "./actions";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const db = supabaseAdmin();
  const [{ data: tiposData, error }, { data: itemsData }] = await Promise.all([
    db.from("tipos_trabajo").select("*").eq("activo", true).order("nombre"),
    db.from("checklist_items").select("id, tipo_trabajo_id"),
  ]);
  if (error) throw new Error(error.message);
  const tipos = (tiposData ?? []) as TipoTrabajo[];
  const conteo = new Map<string, number>();
  for (const item of itemsData ?? []) {
    conteo.set(item.tipo_trabajo_id, (conteo.get(item.tipo_trabajo_id) ?? 0) + 1);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Tipos de trabajo</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Cada tipo de trabajo tiene su propio checklist. Entrá a uno para editar los
        ítems que el técnico completa en campo.
      </p>

      <form
        action={crearTipoTrabajo}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            name="nombre"
            required
            className="w-72 rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Recarga de matafuegos"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Crear tipo de trabajo
        </button>
      </form>

      <div className="mt-6 grid gap-3">
        {tipos.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
          >
            <div>
              <Link
                href={`/catalogo/${t.id}`}
                className="font-medium hover:underline"
              >
                {t.nombre}
              </Link>
              <div className="text-xs text-neutral-500">
                {conteo.get(t.id) ?? 0} ítems en el checklist
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/catalogo/${t.id}`}
                className="text-sm text-blue-700 hover:underline"
              >
                Editar checklist
              </Link>
              <form action={eliminarTipoTrabajo}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-xs text-red-600 hover:underline">
                  Dar de baja
                </button>
              </form>
            </div>
          </div>
        ))}
        {tipos.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
            Sin tipos de trabajo todavía. Creá el primero arriba.
          </div>
        )}
      </div>
    </div>
  );
}
