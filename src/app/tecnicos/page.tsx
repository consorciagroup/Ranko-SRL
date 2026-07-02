import { supabaseAdmin } from "@/lib/supabase/server";
import type { Tecnico } from "@/lib/types";
import { crearTecnico, eliminarTecnico } from "./actions";

export const dynamic = "force-dynamic";

export default async function TecnicosPage() {
  const { data, error } = await supabaseAdmin()
    .from("tecnicos")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  const tecnicos = (data ?? []) as Tecnico[];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Técnicos</h1>
      <p className="mt-1 text-sm text-neutral-500">
        El teléfono tiene que ser el número de WhatsApp del técnico, con código de
        país y sin espacios (ej: 5491122334455).
      </p>

      <form
        action={crearTecnico}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            name="nombre"
            required
            className="w-56 rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Juan Pérez"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Teléfono (WhatsApp)</span>
          <input
            name="telefono"
            required
            className="w-56 rounded-md border border-neutral-300 px-3 py-2"
            placeholder="5491122334455"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Agregar técnico
        </button>
      </form>

      <table className="mt-6 w-full rounded-lg border border-neutral-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {tecnicos.map((t) => (
            <tr key={t.id} className="border-b border-neutral-100 last:border-0">
              <td className="px-4 py-3">{t.nombre}</td>
              <td className="px-4 py-3 font-mono text-xs">{t.telefono}</td>
              <td className="px-4 py-3 text-right">
                <form action={eliminarTecnico}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="text-xs text-red-600 hover:underline">
                    Dar de baja
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {tecnicos.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                Sin técnicos cargados todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
