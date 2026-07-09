"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { EstadoBadge } from "@/components/EstadoBadge";
import { formatFecha } from "@/lib/format";
import type { Direccion, EstadoVisita } from "@/lib/types";
import { crearReporte } from "../actions";

// Vista aplanada de una visita cerrada, lista para el cliente (sin joins).
export type VisitaCerrada = {
  id: string;
  direccion_id: string;
  fecha: string;
  estado: EstadoVisita;
  con_observacion: boolean;
  tipo_trabajo: string;
  tecnico: string;
};

const PASOS = ["Dirección", "Período", "Trabajos", "Revisión"];

type Preset = "dia" | "semana" | "mes" | "custom";

// Aritmética de fechas sobre strings "YYYY-MM-DD". El T12:00:00 mantiene la
// fecha estable ante el huso (misma lógica que lib/format).
function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function shiftMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Asistente de 4 pasos para armar un reporte: dirección → período → trabajos
// (agrupados automáticamente) → revisión. El estado vive en el cliente y se
// envía a la server action `crearReporte`.
export function ReporteWizard({
  hoy,
  direcciones,
  visitas,
}: {
  hoy: string;
  direcciones: Direccion[];
  visitas: VisitaCerrada[];
}) {
  const [step, setStep] = useState(1);
  const [dirId, setDirId] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>("mes");
  const [desde, setDesde] = useState(shiftMonths(hoy, -1));
  const [hasta, setHasta] = useState(hoy);
  // Por defecto entran todos los trabajos del rango; sólo trackeamos los que el
  // usuario destilda. Así no hace falta re-sembrar la selección al cambiar el
  // rango (evita un setState-en-efecto y sus cascading renders).
  const [deseleccionadas, setDeseleccionadas] = useState<Set<string>>(new Set());
  const [titulo, setTitulo] = useState("Informe de inspección");

  const direccion = direcciones.find((d) => d.id === dirId);

  // Trabajos cerrados de la dirección elegida dentro del rango (comparación
  // lexicográfica: válida para fechas ISO "YYYY-MM-DD").
  const trabajos = useMemo(
    () =>
      visitas.filter(
        (v) =>
          v.direccion_id === dirId && v.fecha >= desde && v.fecha <= hasta
      ),
    [visitas, dirId, desde, hasta]
  );

  const aplicarPreset = (p: Preset) => {
    setPreset(p);
    if (p === "dia") {
      setDesde(hoy);
      setHasta(hoy);
    } else if (p === "semana") {
      setDesde(shiftDays(hoy, -6));
      setHasta(hoy);
    } else if (p === "mes") {
      setDesde(shiftMonths(hoy, -1));
      setHasta(hoy);
    }
  };

  const toggleVisita = (id: string) =>
    setDeseleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const seleccionadasList = trabajos.filter((v) => !deseleccionadas.has(v.id));

  const canContinue =
    step === 1
      ? !!dirId
      : step === 2
        ? !!desde && !!hasta && desde <= hasta
        : step === 3
          ? seleccionadasList.length > 0
          : true;

  const rangoLabel =
    desde === hasta
      ? formatFecha(desde)
      : `${formatFecha(desde)} — ${formatFecha(hasta)}`;

  const PRESETS: { key: Preset; label: string }[] = [
    { key: "dia", label: "Un día" },
    { key: "semana", label: "Una semana" },
    { key: "mes", label: "Un mes" },
    { key: "custom", label: "Personalizado" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2">
        {PASOS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-ranko text-white"
                    : done
                      ? "bg-ranko/15 text-ranko"
                      : "bg-canvas text-ink-muted hairline"
                }`}
              >
                {n}
              </span>
              <span
                className={`text-sm ${active ? "font-semibold text-ink" : "text-ink-muted"}`}
              >
                {label}
              </span>
              {n < PASOS.length && <span className="mx-1 h-px w-8 bg-hairline" />}
            </div>
          );
        })}
      </div>

      <form action={crearReporte} className="flex flex-1 flex-col">
        <div className="flex-1 rounded-xl bg-surface p-6 hairline">
          {step === 1 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                ¿De qué dirección es el reporte?
              </h2>
              {direcciones.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2">
                  {direcciones.map((d) => {
                    const sel = d.id === dirId;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDirId(d.id)}
                        className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                          sel
                            ? "bg-ranko/[0.06] ring-2 ring-ranko"
                            : "hairline hover:bg-black/[0.03]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-ink-2">
                            {d.direccion}
                          </div>
                          <div className="text-xs text-ink-muted">{d.cliente}</div>
                        </div>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                            sel ? "bg-ranko" : "hairline"
                          }`}
                        >
                          {sel ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState>
                    No hay direcciones cargadas. Cargá una en la sección
                    Direcciones.
                  </EmptyState>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                ¿Qué período abarca?
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Elegí un rango rápido o ajustá las fechas a mano.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                  const sel = preset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => aplicarPreset(p.key)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        sel
                          ? "bg-ranko text-white"
                          : "text-ink-muted hairline hover:bg-black/[0.03]"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-4">
                <label className="flex w-48 flex-col gap-1 text-sm">
                  <span className="font-medium text-ink-2">Desde</span>
                  <input
                    type="date"
                    value={desde}
                    max={hasta}
                    onChange={(e) => {
                      setPreset("custom");
                      setDesde(e.target.value);
                    }}
                    className="rounded-md border border-hairline bg-surface px-3 py-2"
                  />
                </label>
                <label className="flex w-48 flex-col gap-1 text-sm">
                  <span className="font-medium text-ink-2">Hasta</span>
                  <input
                    type="date"
                    value={hasta}
                    min={desde}
                    onChange={(e) => {
                      setPreset("custom");
                      setHasta(e.target.value);
                    }}
                    className="rounded-md border border-hairline bg-surface px-3 py-2"
                  />
                </label>
              </div>
              {desde > hasta && (
                <p className="mt-3 text-sm text-ranko">
                  La fecha «Desde» no puede ser posterior a «Hasta».
                </p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                Trabajos del período
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {direccion?.direccion} · {rangoLabel}. Destildá los que no quieras
                incluir.
              </p>
              {trabajos.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2">
                  {trabajos.map((v) => {
                    const sel = !deseleccionadas.has(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVisita(v.id)}
                        className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                          sel
                            ? "bg-ranko/[0.06] ring-2 ring-ranko"
                            : "hairline hover:bg-black/[0.03]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-ink-2">
                            {v.tipo_trabajo}
                          </div>
                          <div className="text-xs text-ink-muted">
                            {v.tecnico} · {formatFecha(v.fecha)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <EstadoBadge
                            estado={v.estado}
                            conObservacion={v.con_observacion}
                          />
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs text-white ${
                              sel ? "bg-ranko" : "hairline"
                            }`}
                          >
                            {sel ? "✓" : ""}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState>
                    No hay trabajos cerrados de esta dirección en el período
                    elegido. Probá con otro rango de fechas.
                  </EmptyState>
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                Revisá y confirmá
              </h2>
              <div className="mt-4 flex flex-col gap-5">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-ink-2">Título del reporte</span>
                  <input
                    type="text"
                    name="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="rounded-md border border-hairline bg-surface px-3 py-2"
                  />
                </label>

                <div className="rounded-xl p-4 hairline">
                  <div className="font-medium text-ink-2">
                    {direccion?.direccion}{" "}
                    <span className="text-ink-muted">· {direccion?.cliente}</span>
                  </div>
                  <div className="mt-1 text-sm text-ink-muted">{rangoLabel}</div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {seleccionadasList.map((v) => (
                      <div key={v.id} className="text-sm text-ink-2">
                        {v.tipo_trabajo}{" "}
                        <span className="text-ink-muted">
                          · {v.tecnico} · {formatFecha(v.fecha)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-ink-2">
                    Resumen <span className="text-ink-muted">(opcional)</span>
                  </span>
                  <textarea
                    name="resumen"
                    rows={3}
                    placeholder="Redacción manual por ahora — más adelante lo completa la IA."
                    className="rounded-md border border-hairline bg-surface px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-ink-2">
                    Cierre <span className="text-ink-muted">(opcional)</span>
                  </span>
                  <textarea
                    name="cierre"
                    rows={2}
                    placeholder="Quedamos a disposición ante cualquier consulta."
                    className="rounded-md border border-hairline bg-surface px-3 py-2"
                  />
                </label>

                <p className="text-sm text-ink-muted">
                  Se va a generar un reporte con{" "}
                  <span className="font-semibold text-ink">
                    {seleccionadasList.length}
                  </span>{" "}
                  trabajo{seleccionadasList.length !== 1 && "s"} en estado
                  borrador.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Campos que viajan a la server action */}
        <input type="hidden" name="direccion_id" value={dirId ?? ""} />
        <input type="hidden" name="periodo_desde" value={desde} />
        <input type="hidden" name="periodo_hasta" value={hasta} />
        {seleccionadasList.map((v) => (
          <input key={v.id} type="hidden" name="visitas" value={v.id} />
        ))}

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
          >
            ← Atrás
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((s) => s + 1)}
            >
              Continuar →
            </Button>
          ) : (
            <SubmitButton pendingText="Generando…">Generar reporte</SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}
