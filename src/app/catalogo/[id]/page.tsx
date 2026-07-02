import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ChecklistItem, TipoTrabajo } from "@/lib/types";
import { TIPO_DATO_LABEL } from "@/lib/types";
import { agregarItem, eliminarItem, moverItem } from "../actions";

export const dynamic = "force-dynamic";

export default async function ChecklistBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = supabaseAdmin();
  const [{ data: tipoData }, { data: itemsData }] = await Promise.all([
    db.from("tipos_trabajo").select("*").eq("id", id).maybeSingle(),
    db.from("checklist_items").select("*").eq("tipo_trabajo_id", id).order("orden"),
  ]);
  if (!tipoData) notFound();
  const tipo = tipoData as TipoTrabajo;
  const items = (itemsData ?? []) as ChecklistItem[];

  return (
    <div className="max-w-4xl">
      <Link href="/catalogo" className="text-sm text-ranko-dark hover:underline">
        ← Tipos de trabajo
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
        {tipo.nombre}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Checklist que el técnico completa ítem por ítem en WhatsApp, en este orden.
        Los cambios no afectan visitas ya asignadas.
      </p>

      <div className="mt-6 grid gap-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
          >
            <span className="w-6 text-sm font-semibold text-neutral-400">
              {idx + 1}.
            </span>
            <div className="flex-1">
              <div className="text-sm">{item.texto}</div>
              <div className="text-xs text-neutral-500">
                {TIPO_DATO_LABEL[item.tipo_dato]}
                {item.obligatorio ? " · obligatorio" : " · opcional"}
              </div>
            </div>
            <form action={moverItem} className="flex gap-1">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="tipo_trabajo_id" value={tipo.id} />
              <button
                name="dir"
                value="arriba"
                disabled={idx === 0}
                className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30"
                title="Subir"
              >
                ↑
              </button>
              <button
                name="dir"
                value="abajo"
                disabled={idx === items.length - 1}
                className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30"
                title="Bajar"
              >
                ↓
              </button>
            </form>
            <form action={eliminarItem}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="tipo_trabajo_id" value={tipo.id} />
              <DeleteButton>Eliminar</DeleteButton>
            </form>
          </div>
        ))}
        {items.length === 0 && (
          <EmptyState>Checklist vacío. Agregá el primer ítem abajo.</EmptyState>
        )}
      </div>

      <form
        action={agregarItem}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <input type="hidden" name="tipo_trabajo_id" value={tipo.id} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Ítem</span>
          <input
            name="texto"
            required
            className="w-80 rounded-md border border-neutral-300 px-3 py-2"
            placeholder="¿Se verificó la presión del equipo?"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo de dato</span>
          <select
            name="tipo_dato"
            className="rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="si_no">Sí / No</option>
            <option value="texto">Texto libre</option>
            <option value="foto">Foto</option>
            <option value="numero">Medición numérica</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="obligatorio" defaultChecked />
          Obligatorio
        </label>
        <SubmitButton pendingText="Agregando…">Agregar ítem</SubmitButton>
      </form>
    </div>
  );
}
