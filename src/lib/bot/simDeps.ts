import { realDeps } from "./deps";
import type { BotDeps } from "./engine";
import { construirMenuParadas } from "./menu";
import { appendBandeja } from "@/lib/sim/bandeja";

// Deps del simulador. Reutiliza TODO el lado de datos de realDeps (lee y escribe
// las mismas tablas que el bot real: conversaciones, visitas, visita_items) y
// sólo reemplaza el lado de "enviar": en vez de pegarle a la Meta Cloud API,
// persiste cada mensaje del bot en la bandeja del técnico (sim_inbox), que el
// chat de /simulador/[tecnico] lee. Así el flujo probado es idéntico al real.
export function simDepsBandeja(tecnicoId: string): BotDeps {
  const base = realDeps();

  return {
    ...base,

    async enviarTexto(_telefono, texto) {
      await appendBandeja(tecnicoId, "bot", { tipo: "texto", texto });
    },

    async enviarBotones(_telefono, texto, botones) {
      await appendBandeja(tecnicoId, "bot", { tipo: "botones", texto, botones });
    },

    async enviarMenu(_telefono, tid, fecha, encabezado) {
      await appendBandeja(
        tecnicoId,
        "bot",
        await construirMenuParadas(tid, fecha, encabezado)
      );
    },

    // En el simulador no hay media real de Meta que descargar: guardamos un
    // marcador reconocible como evidencia. El botón "Reiniciar" lo limpia.
    async guardarEvidencia() {
      return "sim://foto-de-prueba";
    },
  };
}
