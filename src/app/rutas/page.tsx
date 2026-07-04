import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import { formatFecha, formatHora } from "@/lib/format";
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

type Grupo = { tecnico: Tecnico; fecha: string; visitas: VisitaConRelaciones[] };

export default async function RutasPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; tecnico?: string; ruta?: string }>;
}) {
  const { fecha: fechaFiltro, tecnico: tecnicoId, ruta: rutaFecha } = await searchParams;
  // Sin filtro se muestran todas las fechas; el modal de alta igual necesita
  // una fecha para precargar, y ahí sí tiene sentido asumir "hoy".
  const fechaModalDefault = fechaFiltro ?? hoyISO();

  const db = supabaseAdmin();
  let visitasQuery = db
    .from("visitas")
    .select("*, direcciones(*), tipos_trabajo(*)")
    .order("fecha", { ascending: true })
    .order("orden", { ascending: true });
  if (fechaFiltro) visitasQuery = visitasQuery.eq("fecha", fechaFiltro);

  const [tecnicosRes, direccionesRes, tiposRes, visitasRes] = await Promise.all([
    db.from("tecnicos").select("*").eq("activo", true).order("nombre"),
    db.from("direcciones").select("*").eq("activo", true).order("cliente"),
    db.from("tipos_trabajo").select("*").eq("activo", true).order("nombre"),
    visitasQuery,
  ]);
  const tecnicos = (tecnicosRes.data ?? []) as Tecnico[];
  const direcciones = (direccionesRes.data ?? []) as Direccion[];
  const tipos = (tiposRes.data ?? []) as TipoTrabajo[];
  const visitas = (visitasRes.data ?? []) as VisitaConRelaciones[];

  // Todas las visitas de cada técnico (cualquier fecha, ya vienen ordenadas
  // por fecha y orden desde la consulta) — alimenta el panel de detalle.
  const porTecnico = new Map<string, VisitaConRelaciones[]>();
  for (const v of visitas) {
    const grupo = porTecnico.get(v.tecnico_id) ?? [];
    grupo.push(v);
    porTecnico.set(v.tecnico_id, grupo);
  }

  // Una tarjeta por técnico + fecha (un técnico con paradas en varios días
  // aparece una vez por día), ordenadas cronológicamente: la más próxima primero.
  const grupos: Grupo[] = [];
  for (const t of tecnicos) {
    const porFecha = new Map<string, VisitaConRelaciones[]>();
    for (const v of porTecnico.get(t.id) ?? []) {
      const arr = porFecha.get(v.fecha) ?? [];
      arr.push(v);
      porFecha.set(v.fecha, arr);
    }
    for (const [fecha, vs] of porFecha) {
      grupos.push({ tecnico: t, fecha, visitas: vs });
    }
  }
  grupos.sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) || a.tecnico.nombre.localeCompare(b.tecnico.nombre)
  );

  const tecnicoSeleccionado = tecnicoId
    ? tecnicos.find((t) => t.id === tecnicoId)
    : undefined;
  // El panel muestra solo la ruta del día que se clickeó, no todas las del técnico.
  const paradasSeleccionadas =
    tecnicoSeleccionado && rutaFecha
      ? (porTecnico.get(tecnicoSeleccionado.id) ?? []).filter(
          (v) => v.fecha === rutaFecha
        )
      : [];

  const hrefTecnico = (id: string, fecha: string) =>
    `?${fechaFiltro ? `fecha=${fechaFiltro}&` : ""}tecnico=${id}&ruta=${fecha}`;

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
                  key={fechaFiltro ?? "todas"}
                  defaultValue={fechaFiltro}
                  className="rounded-md border border-neutral-300 px-3 py-2"
                />
              </label>
              <Button variant="secondary">Ver</Button>
            </form>
            {fechaFiltro && (
              <Link
                href="?"
                scroll={false}
                className="text-sm text-neutral-500 hover:underline"
              >
                Ver todas
              </Link>
            )}
            <CreateModal
              trigger="Agregar ruta"
              title="Agregar ruta"
              submitLabel="Crear ruta"
              pendingLabel="Agregando…"
              action={agregarParada}
              contentClassName="max-w-2xl"
            >
              <AgregarRutaFields
                fecha={fechaModalDefault}
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
      {/* Rutas por técnico y fecha */}
      <div className="grid gap-6">
        {grupos.map((g) => (
          <section
            key={`${g.tecnico.id}-${g.fecha}`}
            className="rounded-lg border border-neutral-200 bg-white"
          >
            <header className="relative flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <div>
                <Link
                  href={hrefTecnico(g.tecnico.id, g.fecha)}
                  scroll={false}
                  className="font-semibold hover:underline"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  {g.tecnico.nombre}
                </Link>
                <span className="ml-2 text-sm text-neutral-500">
                  {formatFecha(g.fecha)} · {g.visitas.length} visita
                  {g.visitas.length !== 1 && "s"}
                </span>
              </div>
              <form action={enviarRuta} className="relative z-10">
                <input type="hidden" name="tecnico_id" value={g.tecnico.id} />
                <input type="hidden" name="fecha" value={g.fecha} />
                <SubmitButton variant="success" pendingText="Enviando…">
                  Enviar ruta por WhatsApp
                </SubmitButton>
              </form>
            </header>
            <ul>
              {g.visitas.map((v) => (
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
        ))}
        {grupos.length === 0 && (
          <EmptyState>
            {fechaFiltro
              ? `Sin visitas para el ${formatFecha(fechaFiltro)}. Agregá la primera parada arriba.`
              : "Sin visitas cargadas todavía. Agregá la primera parada arriba."}
          </EmptyState>
        )}
      </div>
      </div>

      <DetailPanel
        title={
          tecnicoSeleccionado && rutaFecha
            ? `Ruta de ${tecnicoSeleccionado.nombre} — ${formatFecha(rutaFecha)}`
            : undefined
        }
        closeHref={fechaFiltro ? `?fecha=${fechaFiltro}` : "?"}
        emptyMessage="Seleccioná un técnico para ver el orden de sus paradas."
      >
        {tecnicoSeleccionado && rutaFecha ? (
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
              Sin paradas para este técnico.
            </p>
          )
        ) : undefined}
      </DetailPanel>
      </div>
    </div>
  );
}
