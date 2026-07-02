import { supabaseAdmin } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import type { Direccion } from "@/lib/types";
import { crearDireccion, eliminarDireccion } from "./actions";

export const dynamic = "force-dynamic";

export default async function DireccionesPage() {
  const { data, error } = await supabaseAdmin()
    .from("direcciones")
    .select("*")
    .eq("activo", true)
    .order("cliente");
  if (error) throw new Error(error.message);
  const direcciones = (data ?? []) as Direccion[];

  return (
    <div className="max-w-4xl">
      <PageHeader title="Direcciones">
        Clientes y ubicaciones donde se hacen las visitas.
      </PageHeader>

      <form
        action={crearDireccion}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Dirección</span>
          <input
            name="direccion"
            required
            className="w-64 rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Av. Corrientes 1234, CABA"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Cliente</span>
          <input
            name="cliente"
            required
            className="w-56 rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Consorcio Corrientes 1234"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Notas (opcional)</span>
          <input
            name="notas"
            className="w-56 rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Encargado, accesos, etc."
          />
        </label>
        <SubmitButton pendingText="Agregando…">Agregar dirección</SubmitButton>
      </form>

      <table className="mt-6 w-full rounded-lg border border-neutral-200 bg-white text-sm">
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
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
            >
              <td className="px-4 py-3">{d.direccion}</td>
              <td className="px-4 py-3">{d.cliente}</td>
              <td className="px-4 py-3 text-neutral-500">{d.notas}</td>
              <td className="px-4 py-3 text-right">
                <form action={eliminarDireccion}>
                  <input type="hidden" name="id" value={d.id} />
                  <DeleteButton />
                </form>
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
  );
}
