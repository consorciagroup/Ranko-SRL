"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MensajeSalida } from "@/lib/bot/salida";
import type { Tecnico } from "@/lib/types";
import { enviarAlBot, estadoInicial, reiniciarConversacion } from "./actions";

// Una burbuja del chat: la del bot lleva un MensajeSalida estructurado (texto /
// botones / lista); la del técnico o del sistema es texto plano.
type Burbuja =
  | { lado: "bot"; msg: MensajeSalida }
  | { lado: "tecnico"; texto: string }
  | { lado: "sistema"; texto: string };

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

export function SimuladorChat({ tecnicos }: { tecnicos: Tecnico[] }) {
  const [telefono, setTelefono] = useState("");
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);

  const tecnico = tecnicos.find((t) => t.telefono === telefono);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [burbujas, cargando]);

  // Abrir el chat de un técnico: estado inicial sin mandar nada.
  async function abrir(tel: string) {
    setTelefono(tel);
    setTexto("");
    if (!tel) {
      setBurbujas([]);
      return;
    }
    setCargando(true);
    try {
      const { registrado, paso, salida } = await estadoInicial(tel);
      const inicio: Burbuja[] = [];
      if (!registrado) {
        inicio.push({
          lado: "sistema",
          texto: "Este número no está registrado como técnico activo.",
        });
      } else if (paso !== "menu") {
        inicio.push({
          lado: "sistema",
          texto: `El técnico está a mitad de un flujo (paso: ${paso}). Mandale un mensaje para seguir desde ahí, o tocá Reiniciar.`,
        });
      }
      setBurbujas([...inicio, ...salida.map((m) => bot(m))]);
    } finally {
      setCargando(false);
    }
  }

  const bot = (msg: MensajeSalida): Burbuja => ({ lado: "bot", msg });

  // Núcleo de un turno: agrega la burbuja del técnico y pinta la respuesta.
  async function turno(entrada: {
    texto?: string;
    interactiveId?: string;
    imagen?: boolean;
    etiquetaTecnico: string;
  }) {
    if (!telefono || cargando) return;
    setBurbujas((prev) => [
      ...prev,
      { lado: "tecnico", texto: entrada.etiquetaTecnico },
    ]);
    setCargando(true);
    try {
      const salida = await enviarAlBot({
        telefono,
        texto: entrada.texto,
        interactiveId: entrada.interactiveId,
        imagen: entrada.imagen,
      });
      setBurbujas((prev) => [...prev, ...salida.map((m) => bot(m))]);
    } finally {
      setCargando(false);
    }
  }

  function enviarTexto() {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    turno({ texto: t, etiquetaTecnico: t });
  }

  async function reiniciar() {
    if (!tecnico || cargando) return;
    setCargando(true);
    try {
      await reiniciarConversacion(tecnico.id);
      const { salida } = await estadoInicial(tecnico.telefono);
      setBurbujas([
        { lado: "sistema", texto: "Conversación y visitas de hoy reiniciadas." },
        ...salida.map((m) => bot(m)),
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl bg-surface hairline">
      {/* Barra: elegir técnico + reiniciar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-muted">Técnico</span>
          <select
            value={telefono}
            onChange={(e) => abrir(e.target.value)}
            className="min-w-[220px] rounded-md bg-canvas px-3 py-2 hairline"
          >
            <option value="">Elegí un técnico…</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.telefono}>
                {t.nombre} · {t.telefono}
              </option>
            ))}
          </select>
        </label>
        <div className="flex-1" />
        {tecnico && (
          <Button variant="danger" onClick={reiniciar} disabled={cargando}>
            Reiniciar
          </Button>
        )}
      </div>

      {/* Chat */}
      <div className="flex h-[520px] flex-col gap-3 overflow-y-auto bg-canvas p-4">
        {!tecnico && (
          <p className="m-auto max-w-sm text-center text-sm text-ink-muted">
            Elegí un técnico arriba para empezar a conversar con el bot como si
            fueras él.
          </p>
        )}

        {burbujas.map((b, i) =>
          b.lado === "sistema" ? (
            <div
              key={i}
              className="mx-auto rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-muted"
            >
              {b.texto}
            </div>
          ) : b.lado === "tecnico" ? (
            <div
              key={i}
              className="max-w-[80%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-ranko px-4 py-2.5 text-sm text-white"
            >
              {b.texto}
            </div>
          ) : (
            <BurbujaBot
              key={i}
              msg={b.msg}
              cargando={cargando}
              onInteractive={(id, title) =>
                turno({ interactiveId: id, etiquetaTecnico: title })
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

      {/* Input */}
      {tecnico && (
        <div className="flex items-center gap-2 border-t border-hairline p-3">
          <button
            type="button"
            onClick={() => turno({ imagen: true, etiquetaTecnico: "📷 Foto" })}
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
      )}
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
