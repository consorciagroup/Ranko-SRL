import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import { fechaRelativa } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { CreateModal } from "@/components/ui/CreateModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TechCard } from "@/components/ui/TechCard";
import type { Tecnico } from "@/lib/types";
import { calcularStatsTecnicos, type VisitaStat } from "./stats";
import { crearTecnico, eliminarTecnico } from "./actions";

export const dynamic = "force-dynamic";

export default async function TecnicosPage() {
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7); // "YYYY-MM"

  const db = supabaseAdmin();
  const [{ data, error }, visitasRes] = await Promise.all([
    db.from("tecnicos").select("*").eq("activo", true).order("nombre"),
    // Todas las visitas ordenadas de más reciente a más vieja: la primera de
    // cada técnico es su "último trabajo", y contamos las del mes en curso.
    db
      .from("visitas")
      .select("tecnico_id, fecha, direcciones(cliente)")
      .order("fecha", { ascending: false }),
  ]);
  if (error) throw new Error(error.message);
  const tecnicos = (data ?? []) as Tecnico[];
  const visitas = (visitasRes.data ?? []) as unknown as VisitaStat[];

  const stats = calcularStatsTecnicos(visitas, mesActual);

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Técnicos"
        bell
        actions={
          <CreateModal
            trigger="+ Nuevo técnico"
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
                className="w-full rounded-md border border-hairline bg-surface px-3 py-2"
                placeholder="Juan Pérez"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Teléfono (WhatsApp)</span>
              <input
                name="telefono"
                required
                className="w-full rounded-md border border-hairline bg-surface px-3 py-2"
                placeholder="5491122334455"
              />
            </label>
          </CreateModal>
        }
      >
      </PageHeader>

      <div className="mb-6">
        <SearchInput placeholder="Buscar técnico…" />
      </div>

      {tecnicos.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tecnicos.map((t) => {
            const s = stats.get(t.id);
            return (
              <TechCard
                key={t.id}
                id={t.id}
                nombre={t.nombre}
                telefono={t.telefono}
                reportesMes={s?.mes ?? 0}
                ultimoTrabajo={
                  s?.ultimo
                    ? `${s.ultimo.cliente} · ${fechaRelativa(s.ultimo.fecha, hoy)}`
                    : null
                }
                eliminar={eliminarTecnico}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState>
          Sin técnicos cargados todavía. Agregá el primero desde el botón de arriba.
        </EmptyState>
      )}
    </div>
  );
}
