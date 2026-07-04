import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateModal } from "@/components/ui/CreateModal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { Field } from "@/components/ui/Field";
import type { Tecnico } from "@/lib/types";
import { crearTecnico, eliminarTecnico } from "./actions";

export const dynamic = "force-dynamic";

export default async function TecnicosPage({
  searchParams,
}: {
  searchParams: Promise<{ tecnico?: string }>;
}) {
  const { tecnico: tecnicoId } = await searchParams;

  const db = supabaseAdmin();
  const [{ data, error }, visitasHoyRes] = await Promise.all([
    db.from("tecnicos").select("*").eq("activo", true).order("nombre"),
    tecnicoId
      ? db
          .from("visitas")
          .select("*", { count: "exact", head: true })
          .eq("tecnico_id", tecnicoId)
          .eq("fecha", hoyISO())
      : Promise.resolve({ count: null }),
  ]);
  if (error) throw new Error(error.message);
  const tecnicos = (data ?? []) as Tecnico[];
  const tecnicoSeleccionado = tecnicoId
    ? tecnicos.find((t) => t.id === tecnicoId)
    : undefined;
  const visitasHoy = visitasHoyRes.count ?? 0;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Técnicos"
        actions={
          <CreateModal
            trigger="Agregar técnico"
            title="Agregar técnico"
            submitLabel="Crear técnico"
            pendingLabel="Agregando…"
            action={crearTecnico}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Nombre</span>
              <input
                name="nombre"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                placeholder="Juan Pérez"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Teléfono (WhatsApp)</span>
              <input
                name="telefono"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                placeholder="5491122334455"
              />
            </label>
          </CreateModal>
        }
      >
        El teléfono tiene que ser el número de WhatsApp del técnico, con código de
        país y sin espacios (ej: 5491122334455).
      </PageHeader>

      <div className="mt-6 flex items-start gap-6">
      <div className="min-w-0 flex-1">
      <table className="w-full rounded-lg border border-neutral-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="w-24 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {tecnicos.map((t) => (
            <tr
              key={t.id}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`?tecnico=${t.id}`}
                  scroll={false}
                  className="font-medium hover:underline"
                >
                  {t.nombre}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{t.telefono}</td>
              <td className="px-4 py-3 text-right">
                <ConfirmDeleteButton
                  action={eliminarTecnico}
                  id={t.id}
                  titulo="Eliminar técnico"
                  mensaje={`El técnico "${t.nombre}" dejará de recibir visitas por WhatsApp. Las visitas ya cargadas no se modifican.`}
                />
              </td>
            </tr>
          ))}
          {tecnicos.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                Sin técnicos cargados todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <DetailPanel
        title={tecnicoSeleccionado?.nombre}
        closeHref="?"
        emptyMessage="Seleccioná un técnico para ver su ficha."
      >
        {tecnicoSeleccionado ? (
          <dl className="space-y-3">
            <Field label="Teléfono">
              <span className="font-mono text-xs">
                {tecnicoSeleccionado.telefono}
              </span>
            </Field>
            <Field label="Activo">
              {tecnicoSeleccionado.activo ? "Sí" : "No"}
            </Field>
            <Field label="Visitas de hoy">{visitasHoy}</Field>
          </dl>
        ) : undefined}
      </DetailPanel>
      </div>
    </div>
  );
}
