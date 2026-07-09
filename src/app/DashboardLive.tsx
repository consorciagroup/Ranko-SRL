"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { EstadoBadge } from "@/components/EstadoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { formatHora } from "@/lib/format";
import { calcularEstadoDashboard } from "@/app/dashboard-stats";
import type { Tecnico, VisitaConRelaciones } from "@/lib/types";

// Dashboard del día: recibe los datos iniciales del server y se mantiene en vivo
// suscribiéndose a los cambios de la tabla `visitas` vía Supabase Realtime.
export function DashboardLive({
  fecha,
  tecnicos,
  visitasIniciales,
}: {
  fecha: string;
  tecnicos: Tecnico[];
  visitasIniciales: VisitaConRelaciones[];
}) {
  const [visitas, setVisitas] = useState(visitasIniciales);
  const [enVivo, setEnVivo] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();

    const refetch = async () => {
      const { data } = await supabase
        .from("visitas")
        .select("*, direcciones(*), tipos_trabajo(*)")
        .eq("fecha", fecha)
        .order("orden");
      if (data) setVisitas(data as VisitaConRelaciones[]);
    };

    const channel = supabase
      .channel("dashboard-visitas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitas" },
        // Ante cualquier cambio refetcheamos el día completo: son pocas filas
        // y evita reconstruir joins a mano desde el payload del evento.
        refetch
      )
      .subscribe((status) => setEnVivo(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fecha]);

  const {
    porTecnico,
    tecnicosConVisitas,
    totales,
    atrasadas,
    conObservacion,
    sinAcceso,
    totalAlertas,
  } = calcularEstadoDashboard(visitas, tecnicos);
  const nombreTecnico = new Map(tecnicos.map((t) => [t.id, t.nombre]));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            enVivo ? "bg-estado-completada" : "bg-neutral-300"
          }`}
        />
        {enVivo ? "Actualización en vivo" : "Conectando…"}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Visitas del día" valor={totales.total} />
        <StatCard label="En curso" valor={totales.enCurso} />
        <StatCard label="Completadas" valor={totales.completadas} />
        <StatCard
          label="Sin acceso"
          valor={totales.sinAcceso}
          alerta={totales.sinAcceso > 0}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-xl bg-surface p-5 hairline">
          <h2 className="font-display text-lg font-bold text-ink">
            Visitas de hoy por técnico
          </h2>
          {tecnicosConVisitas.length === 0 && (
            <EmptyState>
              No hay visitas asignadas para hoy. Armá la ruta en la sección Rutas.
            </EmptyState>
          )}
          {tecnicosConVisitas.map((t) => (
            <div key={t.id} className="flex flex-col">
              <div className="flex items-center gap-2.5 py-2">
                <Avatar nombre={t.nombre} size={28} />
                <span className="text-sm font-semibold text-ink-2">
                  {t.nombre}
                </span>
              </div>
              {porTecnico.get(t.id)!.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 py-2.5 pl-9 shadow-[inset_0_-1px_0_var(--color-hairline)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-2">
                      {v.direcciones.cliente}
                      <span className="text-ink-muted">
                        {" "}
                        · {v.tipos_trabajo.nombre}
                      </span>
                    </div>
                    <div className="text-xs text-ink-muted">
                      {v.iniciada_at ? `inició ${formatHora(v.iniciada_at)}` : "sin iniciar"}
                      {v.completada_at && ` · terminó ${formatHora(v.completada_at)}`}
                    </div>
                  </div>
                  <EstadoBadge estado={v.estado} conObservacion={v.con_observacion} />
                </div>
              ))}
            </div>
          ))}
        </section>

        <aside className="flex min-h-0 w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div
            className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl bg-surface p-5 ${
              totalAlertas > 0
                ? "shadow-[inset_0_0_0_1px_var(--color-ranko)]"
                : "hairline"
            }`}
          >
            <h2 className="font-display text-lg font-bold text-ink">
              Alertas {totalAlertas > 0 ? `(${totalAlertas})` : ""}
            </h2>
            {totalAlertas === 0 && (
              <p className="text-sm text-ink-muted">Sin alertas — todo en horario.</p>
            )}
            {atrasadas.map((v) => (
              <AlertRow
                key={v.id}
                tono="danger"
                texto={`${nombreTecnico.get(v.tecnico_id) ?? "Técnico"} no inició "${v.tipos_trabajo.nombre}" en ${v.direcciones.cliente}`}
              />
            ))}
            {conObservacion.map((v) => (
              <AlertRow
                key={v.id}
                tono="warning"
                texto={`Ítem con observación en ${v.direcciones.cliente} (${v.tipos_trabajo.nombre})`}
              />
            ))}
            {sinAcceso.map((v) => (
              <AlertRow
                key={v.id}
                tono="danger"
                texto={`Sin acceso en ${v.direcciones.cliente} — ${nombreTecnico.get(v.tecnico_id) ?? "Técnico"}`}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function AlertRow({ tono, texto }: { tono: "danger" | "warning"; texto: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
          tono === "danger" ? "bg-estado-sinacceso" : "bg-estado-revision"
        }`}
      />
      <span className="text-xs leading-snug text-ink-2">{texto}</span>
    </div>
  );
}

