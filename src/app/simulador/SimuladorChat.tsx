"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MensajeSalida } from "@/lib/bot/salida";
import type { BandejaMsg } from "@/lib/sim/bandeja";
import { enviarComoTecnico, reiniciar, traerBandeja } from "./actions";

type TecnicoLite = { id: string; nombre: string; telefono: string };

// *negrita* de WhatsApp → <strong>, respetando saltos de línea.
function renderTexto(texto: string) {
  return texto.split(/(\*[^*]+\*)/g).map((p, i) =>
    p.length > 2 && p.startsWith("*") && p.endsWith("*") ? (
      <strong key={i}>{p.slice(1, -1)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function ultimoId(msgs: BandejaMsg[]): number {
  return msgs.length ? msgs[msgs.length - 1].id : 0;
}

export function SimuladorChat({
  tecnico,
  bandejaInicial,
}: {
  tecnico: TecnicoLite;
  bandejaInicial: BandejaMsg[];
}) {
  const [mensajes, setMensajes] = useState<BandejaMsg[]>(bandejaInicial);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);
  // Ref para que el intervalo de polling no se pause mientras hay un turno.
  const cargandoRef = useRef(false);
  useEffect(() => {
    cargandoRef.current = cargando;
  }, [cargando]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  // Polling: trae el hilo cada 2,5s para ver llegar la ruta enviada desde otra
  // pestaña. Se saltea si hay un turno en vuelo (no pisar con datos viejos).
  useEffect(() => {
    const t = setInterval(async () => {
      if (cargandoRef.current) return;
      const frescos = await traerBandeja(tecnico.id);
      setMensajes((prev) =>
        ultimoId(frescos) !== ultimoId(prev) || frescos.length !== prev.length
          ? frescos
          : prev
      );
    }, 2500);
    return () => clearInterval(t);
  }, [tecnico.id]);

  const turno = useCallback(
    async (entrada: {
      texto?: string;
      interactiveId?: string;
      imagen?: boolean;
      etiqueta: string;
    }) => {
      if (cargando) return;
      setCargando(true);
      try {
        const res = await enviarComoTecnico({
          tecnicoId: tecnico.id,
          telefono: tecnico.telefono,
          texto: entrada.texto,
          interactiveId: entrada.interactiveId,
          imagen: entrada.imagen,
          etiqueta: entrada.etiqueta,
        });
        setMensajes(res);
      } finally {
        setCargando(false);
      }
    },
    [cargando, tecnico.id, tecnico.telefono]
  );

  function enviarTexto() {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    turno({ texto: t, etiqueta: t });
  }

  async function onReiniciar() {
    if (cargando) return;
    setCargando(true);
    try {
      setMensajes(await reiniciar(tecnico.id));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-surface hairline">
      <div className="flex items-center justify-between border-b border-hairline p-3">
        <span className="text-xs text-ink-muted">
          Simulador · se actualiza solo
        </span>
        <Button variant="danger" onClick={onReiniciar} disabled={cargando}>
          Reiniciar
        </Button>
      </div>

      <div className="flex h-[520px] flex-col gap-3 overflow-y-auto bg-canvas p-4">
        {mensajes.length === 0 && (
          <p className="m-auto max-w-sm text-center text-sm text-ink-muted">
            Todavía no hay mensajes. Mandá la ruta de este técnico desde Rutas, o
            escribí un mensaje para que el bot muestre sus paradas.
          </p>
        )}

        {mensajes.map((m) =>
          m.lado === "sistema" ? (
            <div
              key={m.id}
              className="mx-auto rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-muted"
            >
              {(m.payload as { texto: string }).texto}
            </div>
          ) : m.lado === "tecnico" ? (
            <div
              key={m.id}
              className="max-w-[80%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-ranko px-4 py-2.5 text-sm text-white"
            >
              {(m.payload as { texto: string }).texto}
            </div>
          ) : (
            <BurbujaBot
              key={m.id}
              msg={m.payload as MensajeSalida}
              cargando={cargando}
              onInteractive={(id, title) =>
                turno({ interactiveId: id, etiqueta: title })
              }
            />
          )
        )}

        {cargando && (
          <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-surface px-4 py-2.5 text-sm text-ink-muted hairline">
            escribiendo…
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-hairline p-3">
        <button
          type="button"
          onClick={() => turno({ imagen: true, etiqueta: "📷 Foto" })}
          disabled={cargando}
          title="Enviar una foto de prueba (para ítems tipo foto)"
          className="shrink-0 rounded-full px-3 py-2 text-lg hairline hover:bg-black/[0.04] disabled:opacity-50"
        >
          📷
        </button>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviarTexto();
          }}
          placeholder="Escribí un mensaje…"
          disabled={cargando}
          className="flex-1 rounded-full bg-canvas px-4 py-2.5 text-sm hairline"
        />
        <Button onClick={enviarTexto} disabled={cargando || !texto.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}

// Burbuja del bot: texto plano, o texto + botones, o texto + lista de paradas.
function BurbujaBot({
  msg,
  cargando,
  onInteractive,
}: {
  msg: MensajeSalida;
  cargando: boolean;
  onInteractive: (id: string, title: string) => void;
}) {
  return (
    <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-surface px-4 py-2.5 text-sm text-ink hairline">
      <p className="whitespace-pre-wrap">{renderTexto(msg.texto)}</p>

      {msg.tipo === "botones" && (
        <div className="mt-3 flex flex-col gap-2">
          {msg.botones.map((b) => (
            <button
              key={b.id}
              type="button"
              disabled={cargando}
              onClick={() => onInteractive(b.id, b.title)}
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-estado-encurso hairline hover:bg-black/[0.04] disabled:opacity-50"
            >
              {b.title}
            </button>
          ))}
        </div>
      )}

      {msg.tipo === "lista" && (
        <div className="mt-3 flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {msg.buttonText}
          </span>
          {msg.sections.flatMap((s) =>
            s.rows.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={cargando}
                onClick={() => onInteractive(r.id, r.title)}
                className="flex flex-col items-start rounded-lg px-3 py-2 text-left hairline hover:bg-black/[0.04] disabled:opacity-50"
              >
                <span className="text-sm font-medium text-ink">{r.title}</span>
                {r.description && (
                  <span className="text-xs text-ink-muted">{r.description}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
