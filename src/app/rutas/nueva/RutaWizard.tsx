"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatFecha } from "@/lib/format";
import type { Direccion, Tecnico, TipoTrabajo } from "@/lib/types";
import { agregarParada } from "../actions";

const PASOS = ["Técnico", "Direcciones", "Tipos de trabajo", "Revisión"];

// Asistente de 4 pasos para armar una ruta (técnico → direcciones → tipos de
// trabajo por dirección → revisión). Junta el estado en el cliente y lo envía
// a la server action `agregarParada`, con los mismos nombres de campos que
// usaba el form del modal (fecha, tecnico_id, direcciones[], tipos_<dirId>[]).
export function RutaWizard({
  fechaDefault,
  tecnicos,
  direcciones,
  tipos,
}: {
  fechaDefault: string;
  tecnicos: Tecnico[];
  direcciones: Direccion[];
  tipos: TipoTrabajo[];
}) {
  const [step, setStep] = useState(1);
  const [tecnicoId, setTecnicoId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(fechaDefault);
  const [dirIds, setDirIds] = useState<string[]>([]);
  const [tiposPorDir, setTiposPorDir] = useState<Record<string, string[]>>({});

  const tecnico = tecnicos.find((t) => t.id === tecnicoId);
  const dirsSel = direcciones.filter((d) => dirIds.includes(d.id));
  const tipoNombre = (id: string) => tipos.find((t) => t.id === id)?.nombre ?? id;

  const toggleDir = (id: string) =>
    setDirIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleTipo = (dirId: string, tipoId: string) =>
    setTiposPorDir((prev) => {
      const cur = prev[dirId] ?? [];
      const next = cur.includes(tipoId)
        ? cur.filter((x) => x !== tipoId)
        : [...cur, tipoId];
      return { ...prev, [dirId]: next };
    });

  const totalVisitas = dirIds.reduce(
    (n, id) => n + (tiposPorDir[id]?.length ?? 0),
    0
  );

  const canContinue =
    step === 1
      ? !!tecnicoId
      : step === 2
        ? dirIds.length > 0
        : step === 3
          ? dirIds.every((id) => (tiposPorDir[id]?.length ?? 0) > 0)
          : true;

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

      <form action={agregarParada} className="flex flex-1 flex-col">
        <div className="flex-1 rounded-xl bg-surface p-6 hairline">
          {step === 1 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                ¿Para qué técnico armamos la ruta?
              </h2>
              {tecnicos.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {tecnicos.map((t) => {
                    const sel = t.id === tecnicoId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTecnicoId(t.id)}
                        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-left transition-colors ${
                          sel
                            ? "bg-ranko/[0.06] ring-2 ring-ranko"
                            : "hairline hover:bg-black/[0.03]"
                        }`}
                      >
                        <Avatar nombre={t.nombre} size={32} />
                        <span className="font-medium text-ink-2">{t.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState>
                    No hay técnicos activos. Cargá uno en la sección Técnicos.
                  </EmptyState>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                ¿En qué direcciones?
              </h2>
              {direcciones.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2">
                  {direcciones.map((d) => {
                    const sel = dirIds.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDir(d.id)}
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
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs text-white ${
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
                    No hay direcciones cargadas. Cargá una en la sección Direcciones.
                  </EmptyState>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                ¿Qué trabajos en cada dirección?
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Cada tipo elegido genera una visita con su propio checklist.
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {dirsSel.map((d) => (
                  <div key={d.id} className="rounded-xl p-4 hairline">
                    <div className="font-medium text-ink-2">
                      {d.direccion}{" "}
                      <span className="text-ink-muted">· {d.cliente}</span>
                    </div>
                    {tipos.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tipos.map((t) => {
                          const sel = (tiposPorDir[d.id] ?? []).includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleTipo(d.id, t.id)}
                              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                sel
                                  ? "bg-ranko text-white"
                                  : "text-ink-muted hairline hover:bg-black/[0.03]"
                              }`}
                            >
                              {t.nombre}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-ink-muted">
                        No hay tipos de trabajo. Creá uno en la sección Trabajos.
                      </p>
                    )}
                    {(tiposPorDir[d.id]?.length ?? 0) === 0 && tipos.length > 0 && (
                      <p className="mt-2 text-xs text-ink-muted">
                        Elegí al menos un tipo de trabajo.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-display text-lg font-bold text-ink">
                Revisá y confirmá
              </h2>
              <div className="mt-4 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  {tecnico && <Avatar nombre={tecnico.nombre} size={40} />}
                  <div>
                    <div className="font-medium text-ink-2">
                      {tecnico?.nombre ?? "—"}
                    </div>
                    <div className="text-xs text-ink-muted">Técnico asignado</div>
                  </div>
                </div>

                <label className="flex w-52 flex-col gap-1 text-sm">
                  <span className="font-medium text-ink-2">Fecha de la ruta</span>
                  <input
                    type="date"
                    name="fecha"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="rounded-md border border-hairline bg-surface px-3 py-2"
                  />
                </label>

                <div className="flex flex-col gap-3">
                  {dirsSel.map((d) => (
                    <div key={d.id} className="rounded-xl p-4 hairline">
                      <div className="font-medium text-ink-2">
                        {d.direccion}{" "}
                        <span className="text-ink-muted">· {d.cliente}</span>
                      </div>
                      <div className="mt-1 text-sm text-ink-muted">
                        {(tiposPorDir[d.id] ?? []).map(tipoNombre).join(" · ") ||
                          "Sin trabajos"}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-ink-muted">
                  Se van a crear{" "}
                  <span className="font-semibold text-ink">{totalVisitas}</span>{" "}
                  visita{totalVisitas !== 1 && "s"} para el {formatFecha(fecha)}.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Campos que viajan a la server action (mismos names que el form viejo) */}
        <input type="hidden" name="tecnico_id" value={tecnicoId ?? ""} />
        {dirIds.map((id) => (
          <input key={id} type="hidden" name="direcciones" value={id} />
        ))}
        {dirIds.flatMap((id) =>
          (tiposPorDir[id] ?? []).map((tid) => (
            <input
              key={`${id}-${tid}`}
              type="hidden"
              name={`tipos_${id}`}
              value={tid}
            />
          ))
        )}

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
            <SubmitButton pendingText="Creando…">Crear ruta</SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}
