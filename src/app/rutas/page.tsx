import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import type {
  Direccion,
  Tecnico,
  TipoTrabajo,
  VisitaConRelaciones,
} from "@/lib/types";
import { EstadoBadge } from "@/components/EstadoBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { agregarParada, eliminarVisita, enviarRuta } from "./actions";

export const dynamic = "force-dynamic";

export default async function RutasPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaParam } = await searchParams;
  const fecha = fechaParam ?? hoyISO();

  const db = supabaseAdmin();
  const [tecnicosRes, direccionesRes, tiposRes, visitasRes] = await Promise.all([
    db.from("tecnicos").select("*").eq("activo", true).order("nombre"),
    db.from("direcciones").select("*").eq("activo", true).order("cliente"),
    db.from("tipos_trabajo").select("*").eq("activo", true).order("nombre"),
    db
      .from("visitas")
      .select("*, direcciones(*), tipos_trabajo(*)")
      .eq("fecha", fecha)
      .order("orden"),
  ]);
  const tecnicos = (tecnicosRes.data ?? []) as Tecnico[];
  const direcciones = (direccionesRes.data ?? []) as Direccion[];
  const tipos = (tiposRes.data ?? []) as TipoTrabajo[];
  const visitas = (visitasRes.data ?? []) as VisitaConRelaciones[];

  const porTecnico = new Map<string, VisitaConRelaciones[]>();
  for (const v of visitas) {
    const grupo = porTecnico.get(v.tecnico_id) ?? [];
    grupo.push(v);
    porTecnico.set(v.tecnico_id, grupo);
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Rutas"
        actions={
          <form method="get" className="flex items-end gap-2 text-sm">
            <label htmlFor="fecha" className="flex flex-col gap-1">
              <span className="text-neutral-500">Día</span>
              <input
                id="fecha"
                type="date"
                name="fecha"
                defaultValue={fecha}
                className="rounded-md border border-neutral-300 px-3 py-2"
              />
            </label>
            <Button variant="secondary">Ver</Button>
          </form>
        }
      >
        Cada tipo de trabajo en una dirección genera una visita independiente con
        su propio checklist. La ruta se puede armar el día anterior o el mismo día.
      </PageHeader>

      {/* Agregar parada */}
      <form
        action={agregarParada}
        className="mt-6 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <input type="hidden" name="fecha" value={fecha} />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Técnico</span>
            <select
              name="tecnico_id"
              required
              className="w-48 rounded-md border border-neutral-300 px-3 py-2"
            >
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Dirección</span>
            <select
              name="direccion_id"
              required
              className="w-64 rounded-md border border-neutral-300 px-3 py-2"
            >
              {direcciones.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.direccion} — {d.cliente}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-1 text-sm">
            <legend className="font-medium">Tipos de trabajo</legend>
            <div className="flex flex-wrap gap-3 rounded-md border border-neutral-300 px-3 py-2">
              {tipos.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5">
                  <input type="checkbox" name="tipos_trabajo" value={t.id} />
                  {t.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          <SubmitButton pendingText="Agregando…">Agregar parada</SubmitButton>
        </div>
      </form>

      {/* Rutas por técnico */}
      <div className="mt-8 grid gap-6">
        {tecnicos
          .filter((t) => porTecnico.has(t.id))
          .map((t) => {
            const visitasTecnico = porTecnico.get(t.id)!;
            return (
              <section
                key={t.id}
                className="rounded-lg border border-neutral-200 bg-white"
              >
                <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                  <div>
                    <span className="font-semibold">{t.nombre}</span>
                    <span className="ml-2 text-sm text-neutral-500">
                      {visitasTecnico.length} visita
                      {visitasTecnico.length !== 1 && "s"}
                    </span>
                  </div>
                  <form action={enviarRuta}>
                    <input type="hidden" name="tecnico_id" value={t.id} />
                    <input type="hidden" name="fecha" value={fecha} />
                    <SubmitButton variant="success" pendingText="Enviando…">
                      Enviar ruta por WhatsApp
                    </SubmitButton>
                  </form>
                </header>
                <ul>
                  {visitasTecnico.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {v.direcciones.direccion}
                          <span className="ml-2 text-neutral-500">
                            {v.tipos_trabajo.nombre}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {v.direcciones.cliente}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <EstadoBadge estado={v.estado} />
                        {v.estado === "asignada" && (
                          <form action={eliminarVisita}>
                            <input type="hidden" name="id" value={v.id} />
                            <DeleteButton>Quitar</DeleteButton>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        {visitas.length === 0 && (
          <EmptyState>
            Sin visitas para el {fecha}. Agregá la primera parada arriba.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
