"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import type { Direccion, EstadoVisita, TipoTrabajo } from "@/lib/types";
import { agregarDestinoARuta, eliminarVisita, reordenarVisitas } from "./actions";

export type ParadaEditable = {
  id: string;
  direccion: string;
  cliente: string;
  tipoTrabajo: string;
  estado: EstadoVisita;
};

// Modal de edición de una ruta (técnico + fecha) ya armada: reordenar paradas
// arrastrándolas, quitar paradas no iniciadas y agregar nuevos destinos entre
// las direcciones/tipos de trabajo ya cargados. Vive junto al detalle lateral
// de /rutas, que es el único lugar donde se abre.
export function EditarRutaModal({
  tecnicoId,
  fecha,
  tecnicoNombre,
  paradas,
  direcciones,
  tipos,
}: {
  tecnicoId: string;
  fecha: string;
  tecnicoNombre: string;
  paradas: ParadaEditable[];
  direcciones: Direccion[];
  tipos: TipoTrabajo[];
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
      >
        Editar ruta
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        contentClassName="max-w-lg"
      >
        <h2 id={titleId} className="font-display text-lg font-bold text-ink">
          Editar ruta de {tecnicoNombre}
        </h2>

        <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1">
          <OrdenParadas tecnicoId={tecnicoId} fecha={fecha} paradas={paradas} />
          <AgregarDestino
            tecnicoId={tecnicoId}
            fecha={fecha}
            direcciones={direcciones}
            tipos={tipos}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </>
  );
}

function OrdenParadas({
  tecnicoId,
  fecha,
  paradas,
}: {
  tecnicoId: string;
  fecha: string;
  paradas: ParadaEditable[];
}) {
  const [items, setItems] = useState(paradas);
  const [isPending, startTransition] = useTransition();
  const dragFrom = useRef<number | null>(null);

  // Resincroniza con lo que llega del server (tras agregar/quitar/guardar el
  // orden) ajustando el estado durante el render, sin efecto — durante el
  // drag el estado local ya refleja el resultado, así que no hay parpadeo al
  // confirmarse. Ver https://react.dev/learn/you-might-not-need-an-effect
  const [paradasPrevias, setParadasPrevias] = useState(paradas);
  if (paradas !== paradasPrevias) {
    setParadasPrevias(paradas);
    setItems(paradas);
  }

  function soltarEn(index: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === index) return;
    const next = [...items];
    const [movida] = next.splice(from, 1);
    next.splice(index, 0, movida);
    setItems(next);
    startTransition(() => {
      reordenarVisitas(
        tecnicoId,
        fecha,
        next.map((p) => p.id)
      );
    });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-2">Orden de las paradas</h3>
      <p className="mt-0.5 text-xs text-ink-muted">
        Arrastrá una parada para cambiar el orden de la ruta.
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {items.map((v, i) => (
          <li
            key={v.id}
            draggable
            onDragStart={() => {
              dragFrom.current = i;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => soltarEn(i)}
            className="flex cursor-grab items-center gap-3 rounded-lg px-3 py-2 hairline active:cursor-grabbing"
          >
            <span aria-hidden="true" className="text-ink-muted">
              ⠿
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink-2">
                {v.direccion}
                <span className="ml-2 text-ink-muted">{v.tipoTrabajo}</span>
              </div>
              <div className="truncate text-xs text-ink-muted">{v.cliente}</div>
            </div>
            {v.estado === "asignada" && (
              <form action={eliminarVisita}>
                <input type="hidden" name="id" value={v.id} />
                <DeleteButton>Quitar</DeleteButton>
              </form>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-ink-muted">Sin paradas todavía.</p>
        )}
      </ul>
      {isPending && (
        <p className="mt-2 text-xs text-ink-muted">Guardando orden…</p>
      )}
    </div>
  );
}

function AgregarDestino({
  tecnicoId,
  fecha,
  direcciones,
  tipos,
}: {
  tecnicoId: string;
  fecha: string;
  direcciones: Direccion[];
  tipos: TipoTrabajo[];
}) {
  const [dirIds, setDirIds] = useState<string[]>([]);
  const [tiposPorDir, setTiposPorDir] = useState<Record<string, string[]>>({});

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

  const totalNuevas = dirIds.reduce(
    (acc, id) => acc + (tiposPorDir[id]?.length ?? 0),
    0
  );

  return (
    <form action={agregarDestinoARuta} className="mt-6 border-t border-hairline pt-5">
      <input type="hidden" name="tecnico_id" value={tecnicoId} />
      <input type="hidden" name="fecha" value={fecha} />

      <h3 className="text-sm font-semibold text-ink-2">Agregar destino</h3>
      <p className="mt-0.5 text-xs text-ink-muted">
        Elegí una dirección ya cargada y los tipos de trabajo a realizar.
      </p>

      <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {direcciones.map((d) => {
          const sel = dirIds.includes(d.id);
          return (
            <div
              key={d.id}
              className={`rounded-lg px-3 py-2 hairline ${sel ? "bg-ranko/[0.06] ring-2 ring-ranko" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggleDir(d.id)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink-2">
                    {d.direccion}
                  </div>
                  <div className="truncate text-xs text-ink-muted">
                    {d.cliente}
                  </div>
                </div>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs text-white ${
                    sel ? "bg-ranko" : "hairline"
                  }`}
                >
                  {sel ? "✓" : ""}
                </span>
              </button>
              {sel && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tipos.map((t) => {
                    const tSel = (tiposPorDir[d.id] ?? []).includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTipo(d.id, t.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          tSel
                            ? "bg-ranko text-white"
                            : "text-ink-muted hairline hover:bg-black/[0.03]"
                        }`}
                      >
                        {t.nombre}
                      </button>
                    );
                  })}
                  {tipos.length === 0 && (
                    <p className="text-xs text-ink-muted">
                      No hay tipos de trabajo cargados.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {direcciones.length === 0 && (
          <p className="text-sm text-ink-muted">
            No hay direcciones cargadas.
          </p>
        )}
      </div>

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

      <div className="mt-3 flex justify-end">
        <AgregarSubmit
          total={totalNuevas}
          onDone={() => {
            setDirIds([]);
            setTiposPorDir({});
          }}
        />
      </div>
    </form>
  );
}

function AgregarSubmit({
  total,
  onDone,
}: {
  total: number;
  onDone: () => void;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) onDone();
    wasPending.current = pending;
  }, [pending, onDone]);

  return (
    <Button type="submit" disabled={pending || total === 0}>
      {pending ? "Agregando…" : `Agregar${total > 0 ? ` (${total})` : ""}`}
    </Button>
  );
}
