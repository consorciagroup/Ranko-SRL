import { realDeps } from "./deps";
import type { BotDeps } from "./engine";
import { construirMenuParadas } from "./menu";
import type { MensajeSalida } from "./salida";

// Deps del simulador web. Reutiliza TODO el lado de datos de realDeps (lee y
// escribe las mismas tablas de Supabase que el bot real: conversaciones,
// visitas, visita_items), pero reemplaza el lado de "enviar": en vez de pegarle
// a la Meta Cloud API, acumula los mensajes en `salida` para que el chat los
// pinte. Así el flujo probado es idéntico al productivo, sin WhatsApp.
export function simDeps(salida: MensajeSalida[]): BotDeps {
  const base = realDeps();

  return {
    ...base,

    async enviarTexto(_telefono, texto) {
      salida.push({ tipo: "texto", texto });
    },

    async enviarBotones(_telefono, texto, botones) {
      salida.push({ tipo: "botones", texto, botones });
    },

    async enviarMenu(_telefono, tecnicoId, fecha, encabezado) {
      salida.push(await construirMenuParadas(tecnicoId, fecha, encabezado));
    },

    // En el simulador no hay media real de Meta que descargar: guardamos un
    // marcador reconocible como evidencia. El botón "Reiniciar" lo limpia.
    async guardarEvidencia() {
      return "sim://foto-de-prueba";
    },
  };
}
