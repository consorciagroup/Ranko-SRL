import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DetailPanel } from "@/components/ui/DetailPanel";
import type { ChecklistItem, TipoTrabajo } from "@/lib/types";
import { TIPO_DATO_LABEL } from "@/lib/types";
import { crearTipoTrabajo, eliminarTipoTrabajo } from "./actions";

export const dynamic = "force-dynamic";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ trabajo?: string }>;
}) {
  const { trabajo: trabajoId } = await searchParams;
  const db = supabaseAdmin();
  const [{ data: tiposData, error }, { data: itemsData }, itemsTrabajoRes] =
    await Promise.all([
      db.from("tipos_trabajo").select("*").eq("activo", true).order("nombre"),
      db.from("checklist_items").select("id, tipo_trabajo_id"),
      trabajoId
        ? db
            .from("checklist_items")
            .select("*")
            .eq("tipo_trabajo_id", trabajoId)
            .order("orden")
        : Promise.resolve({ data: null }),
    ]);
  if (error) throw new Error(error.message);
  const tipos = (tiposData ?? []) as TipoTrabajo[];
  const conteo = new Map<string, number>();
  for (const item of itemsData ?? []) {
    conteo.set(item.tipo_trabajo_id, (conteo.get(item.tipo_trabajo_id) ?? 0) + 1);
  }
  const trabajoSeleccionado = trabajoId
    ? tipos.find((t) => t.id === trabajoId)
    : undefined;
  const itemsTrabajo = (itemsTrabajoRes.data ?? []) as ChecklistItem[];

  return (
    <div className="max-w-7xl">
      <PageHeader title="Tipos de trabajo">
        Cada tipo de trabajo tiene su propio checklist. Entrá a uno para editar los
        ítems que el técnico completa en campo.
      </PageHeader>

      <div className="mt-6 flex items-start gap-6">
      <div className="min-w-0 flex-1">
      <form
        action={crearTipoTrabajo}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
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
                href={`?trabajo=${t.id}`}
                scroll={false}
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

      <DetailPanel
        title={trabajoSeleccionado?.nombre}
        closeHref="?"
        emptyMessage="Seleccioná un tipo de trabajo para ver su checklist."
      >
        {trabajoSeleccionado ? (
          <div className="space-y-4">
            {itemsTrabajo.length > 0 ? (
              <ol className="space-y-3">
                {itemsTrabajo.map((item, i) => (
                  <li key={item.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-neutral-900">{item.texto}</div>
                      <div className="text-xs text-neutral-500">
                        {TIPO_DATO_LABEL[item.tipo_dato]} ·{" "}
                        {item.obligatorio ? "Obligatorio" : "Opcional"}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-neutral-500">
                Este tipo de trabajo todavía no tiene ítems en el checklist.
              </p>
            )}
            <Link
              href={`/catalogo/${trabajoSeleccionado.id}`}
              className="inline-block text-sm text-ranko-dark hover:underline"
            >
              Editar checklist →
            </Link>
          </div>
        ) : undefined}
      </DetailPanel>
      </div>
    </div>
  );
}
