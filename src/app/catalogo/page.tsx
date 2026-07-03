import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <div className="max-w-7xl">
      <PageHeader title="Tipos de trabajo">
        Cada tipo de trabajo tiene su propio checklist. Entrá a uno para editar los
        ítems que el técnico completa en campo.
      </PageHeader>

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
        <SubmitButton pendingText="Creando…">Crear tipo de trabajo</SubmitButton>
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
                className="text-sm text-ranko-dark hover:underline"
              >
                Editar checklist
              </Link>
              <ConfirmDeleteButton
                action={eliminarTipoTrabajo}
                id={t.id}
                titulo="Dar de baja tipo de trabajo"
                mensaje={`Se dará de baja "${t.nombre}". Su checklist dejará de estar disponible para nuevas visitas. Las visitas ya cargadas conservan su checklist.`}
              />
            </div>
          </div>
        ))}
        {tipos.length === 0 && (
          <EmptyState>Sin tipos de trabajo todavía. Creá el primero arriba.</EmptyState>
        )}
      </div>
    </div>
  );
}
