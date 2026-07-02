"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { EstadoBadge } from "@/components/EstadoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
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

  const porTecnico = new Map<string, VisitaConRelaciones[]>();
  for (const v of visitas) {
    const grupo = porTecnico.get(v.tecnico_id) ?? [];
    grupo.push(v);
    porTecnico.set(v.tecnico_id, grupo);
  }

  const totales = {
    total: visitas.length,
    completadas: visitas.filter((v) =>
      ["completada", "en_revision", "aprobada"].includes(v.estado)
    ).length,
    enCurso: visitas.filter((v) => v.estado === "en_curso").length,
    sinAcceso: visitas.filter((v) => v.estado === "sin_acceso").length,
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            enVivo ? "bg-green-500" : "bg-neutral-300"
          }`}
        />
        {enVivo ? "Actualización en vivo" : "Conectando…"}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        <Kpi label="Visitas del día" valor={totales.total} />
        <Kpi label="En curso" valor={totales.enCurso} />
        <Kpi label="Completadas" valor={totales.completadas} />
        <Kpi
          label="Sin acceso"
          valor={totales.sinAcceso}
          alerta={totales.sinAcceso > 0}
        />
      </div>

      <div className="mt-6 grid gap-6">
        {tecnicos
          .filter((t) => porTecnico.has(t.id))
          .map((t) => (
            <section
              key={t.id}
              className="rounded-lg border border-neutral-200 bg-white"
            >
              <header className="border-b border-neutral-200 px-4 py-3 font-semibold">
                {t.nombre}
              </header>
              <ul>
                {porTecnico.get(t.id)!.map((v) => (
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
                        {v.iniciada_at && (
                          <> · inició {formatHora(v.iniciada_at)}</>
                        )}
                        {v.completada_at && (
                          <> · terminó {formatHora(v.completada_at)}</>
                        )}
                      </div>
                    </div>
                    <EstadoBadge
                      estado={v.estado}
                      conObservacion={v.con_observacion}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        {visitas.length === 0 && (
          <EmptyState>
            No hay visitas asignadas para hoy. Armá la ruta en la sección Rutas.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  valor,
  alerta,
}: {
  label: string;
  valor: number;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-white px-4 py-3 ${
        alerta ? "border-red-300" : "border-neutral-200"
      }`}
    >
      <div className={`text-2xl font-bold ${alerta ? "text-red-600" : ""}`}>
        {valor}
      </div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
}
