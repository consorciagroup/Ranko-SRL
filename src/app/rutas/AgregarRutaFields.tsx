"use client";

import { useState } from "react";
import type { Direccion, Tecnico, TipoTrabajo } from "@/lib/types";

// Campos del modal "Agregar ruta". A diferencia del alta simple, permite tildar
// varias direcciones y, por cada una, elegir sus propios tipos de trabajo. Los
// tipos tildados quedan asociados solo a esa dirección (no hay cross-product
// global entre todas las direcciones y todos los tipos).
export function AgregarRutaFields({
  fecha,
  tecnicos,
  direcciones,
  tipos,
}: {
  fecha: string;
  tecnicos: Tecnico[];
  direcciones: Direccion[];
  tipos: TipoTrabajo[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (direccionId: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(direccionId)) next.delete(direccionId);
      else next.add(direccionId);
      return next;
    });
  };

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha</span>
        <input
          type="date"
          name="fecha"
          required
          defaultValue={fecha}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Técnico</span>
        <select
          name="tecnico_id"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        >
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="font-medium">Direcciones y tipos de trabajo</legend>
        {direcciones.length === 0 ? (
          <p className="text-neutral-500">Sin direcciones cargadas.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-neutral-300 p-3">
            {direcciones.map((d) => (
              <div key={d.id} className="rounded-md border border-neutral-200 p-2">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    name="direcciones"
                    value={d.id}
                    checked={checked.has(d.id)}
                    onChange={() => toggle(d.id)}
                  />
                  {d.direccion} — {d.cliente}
                </label>
                {checked.has(d.id) && (
                  <div className="ml-6 mt-2 flex flex-wrap gap-3">
                    {tipos.map((t) => (
                      <label key={t.id} className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" name={`tipos_${d.id}`} value={t.id} />
                        {t.nombre}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </fieldset>
    </>
  );
}
