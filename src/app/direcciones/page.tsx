import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatFecha, formatHora } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateModal } from "@/components/ui/CreateModal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { Field } from "@/components/ui/Field";
import { EstadoBadge } from "@/components/EstadoBadge";
import type { Direccion, EstadoVisita } from "@/lib/types";
import { crearDireccion, eliminarDireccion } from "./actions";

export const dynamic = "force-dynamic";

// Forma local del join de visitas recientes de esta página (tecnicos(nombre) es
// específico de acá, por eso no se toca VisitaConRelaciones en types.ts).
type VisitaReciente = {
  id: string;
  fecha: string;
  estado: EstadoVisita;
  con_observacion: boolean;
  iniciada_at: string | null;
  tecnicos: { nombre: string } | null;
  tipos_trabajo: { nombre: string } | null;
};

export default async function DireccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ direccion?: string }>;
}) {
  const { direccion: direccionId } = await searchParams;

  const db = supabaseAdmin();
  const [{ data, error }, visitasRes] = await Promise.all([
    db.from("direcciones").select("*").eq("activo", true).order("cliente"),
    direccionId
      ? db
          .from("visitas")
          .select(
            "id, fecha, estado, con_observacion, iniciada_at, tecnicos(nombre), tipos_trabajo(nombre)"
          )
          .eq("direccion_id", direccionId)
          .order("fecha", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
  ]);
  if (error) throw new Error(error.message);
  const direcciones = (data ?? []) as Direccion[];
  const direccionSeleccionada = direccionId
    ? direcciones.find((d) => d.id === direccionId)
    : undefined;
  const visitasRecientes = (visitasRes.data ?? []) as unknown as VisitaReciente[];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Direcciones"
        actions={
          <CreateModal
            trigger="+ Nueva dirección"
            title="Agregar dirección"
            submitLabel="Crear dirección"
            pendingLabel="Agregando…"
            action={crearDireccion}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Dirección</span>
              <input
                name="direccion"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                placeholder="Av. Corrientes 1234, CABA"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Cliente</span>
              <input
                name="cliente"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                placeholder="Consorcio Corrientes 1234"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Notas (opcional)</span>
              <input
                name="notas"
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                placeholder="Encargado, accesos, etc."
              />
            </label>
          </CreateModal>
        }
      >
        Clientes y ubicaciones donde se hacen las visitas.
      </PageHeader>

      <div className="mt-6 flex items-start gap-6">
      <div className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="px-4 py-3 font-medium">Dirección</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Notas</th>
            <th className="w-24 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {direcciones.map((d) => (
            <tr
              key={d.id}
              className="relative border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`?direccion=${d.id}`}
                  scroll={false}
                  className="font-medium hover:underline"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  {d.direccion}
                </Link>
              </td>
              <td className="px-4 py-3">{d.cliente}</td>
              <td className="px-4 py-3 text-neutral-500">{d.notas}</td>
              <td className="relative z-10 px-4 py-3 text-right">
                <ConfirmDeleteButton
                  action={eliminarDireccion}
                  id={d.id}
                  titulo="Eliminar dirección"
                  mensaje={`Se eliminará "${d.direccion}" (${d.cliente}). Las visitas ya cargadas no se modifican.`}
                />
              </td>
            </tr>
          ))}
          {direcciones.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                Sin direcciones cargadas todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      </div>

      <DetailPanel
        title={direccionSeleccionada?.direccion}
        closeHref="?"
        emptyMessage="Seleccioná una dirección para ver su detalle."
      >
        {direccionSeleccionada ? (
          <div className="space-y-4">
            <dl className="space-y-3">
              <Field label="Cliente">{direccionSeleccionada.cliente}</Field>
              <Field label="Notas">
                {direccionSeleccionada.notas || (
                  <span className="text-neutral-400">Sin notas</span>
                )}
              </Field>
            </dl>
            <div>
              <h3 className="text-xs font-medium text-neutral-500">
                Visitas recientes
              </h3>
              {visitasRecientes.length > 0 ? (
                <ul className="mt-2 space-y-3">
                  {visitasRecientes.map((v) => (
                    <li key={v.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {formatFecha(v.fecha)}
                          {v.iniciada_at && (
                            <span className="ml-1 font-normal text-neutral-500">
                              · {formatHora(v.iniciada_at)}
                            </span>
                          )}
                        </span>
                        <EstadoBadge
                          estado={v.estado}
                          conObservacion={v.con_observacion}
                        />
                      </div>
                      <div className="text-xs text-neutral-500">
                        {v.tecnicos?.nombre ?? "—"} · {v.tipos_trabajo?.nombre ?? "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">
                  Sin visitas registradas en esta dirección.
                </p>
              )}
            </div>
          </div>
        ) : undefined}
      </DetailPanel>
      </div>
    </div>
  );
}
