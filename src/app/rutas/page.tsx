import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import { formatHora } from "@/lib/format";
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
import { CreateModal } from "@/components/ui/CreateModal";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { AgregarRutaFields } from "./AgregarRutaFields";
import { agregarParada, eliminarVisita, enviarRuta } from "./actions";

export const dynamic = "force-dynamic";

export default async function RutasPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; tecnico?: string }>;
}) {
  const { fecha: fechaParam, tecnico: tecnicoId } = await searchParams;
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

  const tecnicoSeleccionado = tecnicoId
    ? tecnicos.find((t) => t.id === tecnicoId)
    : undefined;
  const paradasSeleccionadas = tecnicoSeleccionado
    ? porTecnico.get(tecnicoSeleccionado.id) ?? []
    : [];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Rutas"
        actions={
          <div className="flex items-end gap-3">
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
            <CreateModal
              trigger="Agregar ruta"
              title="Agregar ruta"
              submitLabel="Crear ruta"
              pendingLabel="Agregando…"
              action={agregarParada}
              contentClassName="max-w-2xl"
            >
              <AgregarRutaFields
                fecha={fecha}
                tecnicos={tecnicos}
                direcciones={direcciones}
                tipos={tipos}
              />
            </CreateModal>
          </div>
        }
      >
        Cada tipo de trabajo en una dirección genera una visita independiente con
        su propio checklist. La ruta se puede armar el día anterior o el mismo día.
      </PageHeader>

      <div className="mt-6 flex items-start gap-6">
      <div className="min-w-0 flex-1">
      {/* Rutas por técnico */}
      <div className="grid gap-6">
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
                    <Link
                      href={`?fecha=${fecha}&tecnico=${t.id}`}
                      scroll={false}
                      className="font-semibold hover:underline"
                    >
                      {t.nombre}
                    </Link>
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

      <DetailPanel
        title={tecnicoSeleccionado ? `Ruta de ${tecnicoSeleccionado.nombre}` : undefined}
        closeHref={`?fecha=${fecha}`}
        emptyMessage="Seleccioná un técnico para ver el orden de sus paradas."
      >
        {tecnicoSeleccionado ? (
          paradasSeleccionadas.length > 0 ? (
            <ol className="space-y-3">
              {paradasSeleccionadas.map((v, i) => (
                <li key={v.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {v.direcciones.direccion}
                      <span className="ml-2 text-neutral-500">
                        {v.tipos_trabajo.nombre}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {v.direcciones.cliente}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <EstadoBadge
                        estado={v.estado}
                        conObservacion={v.con_observacion}
                      />
                    </div>
                    {(v.iniciada_at || v.completada_at) && (
                      <div className="mt-1 text-xs text-neutral-500">
                        {v.iniciada_at && <>inició {formatHora(v.iniciada_at)}</>}
                        {v.iniciada_at && v.completada_at && " · "}
                        {v.completada_at && (
                          <>terminó {formatHora(v.completada_at)}</>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-neutral-500">
              Sin paradas para este técnico el {fecha}.
            </p>
          )
        ) : undefined}
      </DetailPanel>
      </div>
    </div>
  );
}
