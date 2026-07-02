import type {
  EstadoConversacion,
  Tecnico,
  VisitaItem,
} from "@/lib/types";
import type { VisitaConRelaciones } from "./menu";

// Máquina de estados del bot. No toca Supabase ni la API de WhatsApp
// directamente: todo entra por BotDeps, así el flujo se testea con deps falsas
// (ver engine.test.ts) y el webhook la usa con las reales (deps.ts).

export interface MensajeEntrante {
  // id del mensaje de Meta (wamid). Se usa para deduplicar en el webhook.
  id?: string;
  telefono: string;
  texto?: string;
  // id del botón o fila de lista elegida (button_reply / list_reply)
  interactiveId?: string;
  // media id de Meta cuando mandan una imagen
  imagenMediaId?: string;
}

export interface BotDeps {
  hoy(): string;
  getTecnico(telefono: string): Promise<Tecnico | null>;
  getEstado(tecnicoId: string): Promise<EstadoConversacion>;
  setEstado(tecnicoId: string, estado: EstadoConversacion): Promise<void>;
  visitasPendientes(tecnicoId: string, fecha: string): Promise<VisitaConRelaciones[]>;
  getVisita(id: string): Promise<VisitaConRelaciones | null>;
  actualizarVisita(id: string, patch: Record<string, unknown>): Promise<void>;
  // Ítems de la visita, ordenados por `orden`
  itemsDe(visitaId: string): Promise<VisitaItem[]>;
  actualizarItem(id: string, patch: Record<string, unknown>): Promise<void>;
  // Descarga el media de Meta, lo sube a Storage y devuelve la URL pública
  guardarEvidencia(mediaId: string, visitaId: string, itemId: string): Promise<string>;
  enviarTexto(telefono: string, texto: string): Promise<void>;
  enviarBotones(
    telefono: string,
    texto: string,
    botones: { id: string; title: string }[]
  ): Promise<void>;
  enviarMenu(
    telefono: string,
    tecnicoId: string,
    fecha: string,
    encabezado?: string
  ): Promise<void>;
}

const SKIP_TEXTOS = ["no se puede", "no se pudo", "no puedo"];
const HINT_SKIP = 'Si este punto no se puede completar, respondé "no se puede".';

export async function procesarMensaje(
  msg: MensajeEntrante,
  deps: BotDeps
): Promise<void> {
  const tecnico = await deps.getTecnico(msg.telefono);
  if (!tecnico) {
    await deps.enviarTexto(
      msg.telefono,
      "Este número no está registrado como técnico de Ranko. Hablá con logística para que te den de alta."
    );
    return;
  }

  const estado = await deps.getEstado(tecnico.id);

  switch (estado.paso) {
    case "menu":
      await pasoMenu(msg, tecnico, deps);
      return;
    case "eligiendo_trabajo":
      await pasoEligiendoTrabajo(msg, tecnico, estado.direccion_id, deps);
      return;
    case "checklist":
      await pasoChecklist(msg, tecnico, estado.visita_id, estado.item_id, deps);
      return;
    case "motivo_incompleto":
      await pasoMotivo(msg, tecnico, estado.visita_id, estado.item_id, deps);
      return;
  }
}

async function pasoMenu(msg: MensajeEntrante, tecnico: Tecnico, deps: BotDeps) {
  const fecha = deps.hoy();

  if (msg.interactiveId?.startsWith("parada:")) {
    const direccionId = msg.interactiveId.slice("parada:".length);
    const pendientes = (await deps.visitasPendientes(tecnico.id, fecha)).filter(
      (v) => v.direccion_id === direccionId
    );

    if (pendientes.length === 0) {
      await deps.enviarTexto(
        tecnico.telefono,
        "Esa parada ya no tiene trabajos pendientes."
      );
      await deps.enviarMenu(tecnico.telefono, tecnico.id, fecha);
      return;
    }
    if (pendientes.length === 1) {
      await iniciarVisita(pendientes[0], tecnico, deps);
      return;
    }
    // Varias visitas en la misma dirección: el técnico elige el orden
    await deps.setEstado(tecnico.id, {
      paso: "eligiendo_trabajo",
      direccion_id: direccionId,
    });
    await enviarOpcionesTrabajo(pendientes, tecnico, deps);
    return;
  }

  // Cualquier otro mensaje: (re)mostramos el menú de paradas del día
  await deps.enviarMenu(tecnico.telefono, tecnico.id, fecha);
}

async function enviarOpcionesTrabajo(
  visitas: VisitaConRelaciones[],
  tecnico: Tecnico,
  deps: BotDeps
) {
  await deps.enviarBotones(
    tecnico.telefono,
    `En ${visitas[0].direcciones.direccion} tenés ${visitas.length} trabajos. ¿Con cuál arrancás?`,
    // La API de WhatsApp admite hasta 3 botones; más de 3 trabajos en una misma
    // dirección no es un caso esperado según el cliente.
    visitas.slice(0, 3).map((v) => ({
      id: `trabajo:${v.id}`,
      title: v.tipos_trabajo.nombre,
    }))
  );
}

async function pasoEligiendoTrabajo(
  msg: MensajeEntrante,
  tecnico: Tecnico,
  direccionId: string,
  deps: BotDeps
) {
  const pendientes = (await deps.visitasPendientes(tecnico.id, deps.hoy())).filter(
    (v) => v.direccion_id === direccionId
  );

  if (msg.interactiveId?.startsWith("trabajo:")) {
    const visitaId = msg.interactiveId.slice("trabajo:".length);
    const visita = pendientes.find((v) => v.id === visitaId);
    if (visita) {
      await iniciarVisita(visita, tecnico, deps);
      return;
    }
  }

  if (pendientes.length === 0) {
    await deps.setEstado(tecnico.id, { paso: "menu" });
    await deps.enviarMenu(tecnico.telefono, tecnico.id, deps.hoy());
    return;
  }
  await enviarOpcionesTrabajo(pendientes, tecnico, deps);
}

async function iniciarVisita(
  visita: VisitaConRelaciones,
  tecnico: Tecnico,
  deps: BotDeps
) {
  await deps.actualizarVisita(visita.id, {
    estado: "en_curso",
    iniciada_at: visita.iniciada_at ?? new Date().toISOString(),
  });

  const items = await deps.itemsDe(visita.id);
  const pendiente = items.find((i) => i.estado === "pendiente");
  if (!pendiente) {
    await cerrarVisita(visita.id, tecnico, deps);
    return;
  }

  await deps.enviarTexto(
    tecnico.telefono,
    `Arrancamos: *${visita.tipos_trabajo.nombre}* en ${visita.direcciones.direccion} 🔧\nSon ${items.length} puntos, vamos uno por uno.`
  );
  await preguntarItem(pendiente, items, tecnico, deps);
  await deps.setEstado(tecnico.id, {
    paso: "checklist",
    visita_id: visita.id,
    item_id: pendiente.id,
  });
}

async function preguntarItem(
  item: VisitaItem,
  items: VisitaItem[],
  tecnico: Tecnico,
  deps: BotDeps
) {
  const idx = items.findIndex((i) => i.id === item.id) + 1;
  const encabezado = `*(${idx}/${items.length})* ${item.texto}`;

  switch (item.tipo_dato) {
    case "si_no":
      await deps.enviarBotones(tecnico.telefono, encabezado, [
        { id: "resp:si", title: "Sí" },
        { id: "resp:no", title: "No" },
        { id: "resp:skip", title: "No se pudo ⚠️" },
      ]);
      return;
    case "texto":
      await deps.enviarTexto(
        tecnico.telefono,
        `${encabezado}\n\nRespondé con un mensaje de texto. ${HINT_SKIP}`
      );
      return;
    case "numero":
      await deps.enviarTexto(
        tecnico.telefono,
        `${encabezado}\n\nRespondé solo con el número. ${HINT_SKIP}`
      );
      return;
    case "foto":
      await deps.enviarTexto(
        tecnico.telefono,
        `${encabezado}\n\nMandá la foto por acá. ${HINT_SKIP}`
      );
      return;
  }
}

function esSkip(msg: MensajeEntrante): boolean {
  if (msg.interactiveId === "resp:skip") return true;
  const t = (msg.texto ?? "").trim().toLowerCase();
  return SKIP_TEXTOS.includes(t);
}

async function pasoChecklist(
  msg: MensajeEntrante,
  tecnico: Tecnico,
  visitaId: string,
  itemId: string,
  deps: BotDeps
) {
  const items = await deps.itemsDe(visitaId);
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    // La visita cambió por debajo (ej: logística la sacó): volvemos al menú
    await deps.setEstado(tecnico.id, { paso: "menu" });
    await deps.enviarMenu(tecnico.telefono, tecnico.id, deps.hoy());
    return;
  }

  if (esSkip(msg)) {
    await deps.setEstado(tecnico.id, {
      paso: "motivo_incompleto",
      visita_id: visitaId,
      item_id: itemId,
    });
    await deps.enviarTexto(
      tecnico.telefono,
      "¿Por qué no se pudo completar este punto? Contame brevemente el motivo."
    );
    return;
  }

  const ahora = new Date().toISOString();

  switch (item.tipo_dato) {
    case "si_no": {
      let valor: "si" | "no" | null = null;
      if (msg.interactiveId === "resp:si") valor = "si";
      else if (msg.interactiveId === "resp:no") valor = "no";
      else {
        const t = (msg.texto ?? "").trim().toLowerCase();
        if (t === "si" || t === "sí") valor = "si";
        else if (t === "no") valor = "no";
      }
      if (!valor) {
        await deps.enviarTexto(tecnico.telefono, "Respondé *Sí* o *No* con los botones 🙏");
        return;
      }
      // Un "No" queda como observación: no bloquea, pero marca la visita
      await deps.actualizarItem(item.id, {
        estado: valor === "no" ? "observacion" : "completo",
        valor,
        respondido_at: ahora,
      });
      if (valor === "no") {
        await deps.actualizarVisita(visitaId, { con_observacion: true });
      }
      break;
    }
    case "texto": {
      const t = (msg.texto ?? "").trim();
      if (!t) {
        await deps.enviarTexto(tecnico.telefono, "Necesito que me lo escribas en un mensaje de texto 🙏");
        return;
      }
      await deps.actualizarItem(item.id, {
        estado: "completo",
        valor: t,
        respondido_at: ahora,
      });
      break;
    }
    case "numero": {
      const t = (msg.texto ?? "").trim().replace(",", ".");
      const n = Number(t);
      if (t === "" || Number.isNaN(n)) {
        await deps.enviarTexto(
          tecnico.telefono,
          "Necesito solo el número (ej: 12 o 8.5) 🙏"
        );
        return;
      }
      await deps.actualizarItem(item.id, {
        estado: "completo",
        valor: String(n),
        respondido_at: ahora,
      });
      break;
    }
    case "foto": {
      if (!msg.imagenMediaId) {
        await deps.enviarTexto(tecnico.telefono, "Necesito una foto para este punto 📷");
        return;
      }
      const url = await deps.guardarEvidencia(msg.imagenMediaId, visitaId, item.id);
      await deps.actualizarItem(item.id, {
        estado: "completo",
        evidencia_url: url,
        respondido_at: ahora,
      });
      break;
    }
  }

  await avanzar(visitaId, tecnico, deps);
}

async function pasoMotivo(
  msg: MensajeEntrante,
  tecnico: Tecnico,
  visitaId: string,
  itemId: string,
  deps: BotDeps
) {
  const motivo = (msg.texto ?? "").trim();
  if (!motivo) {
    await deps.enviarTexto(
      tecnico.telefono,
      "Escribime el motivo en un mensaje de texto 🙏"
    );
    return;
  }

  await deps.actualizarItem(itemId, {
    estado: "incompleto",
    motivo,
    respondido_at: new Date().toISOString(),
  });
  await deps.actualizarVisita(visitaId, { con_observacion: true });
  await deps.enviarTexto(tecnico.telefono, "Anotado ⚠️ Seguimos.");
  await avanzar(visitaId, tecnico, deps);
}

async function avanzar(visitaId: string, tecnico: Tecnico, deps: BotDeps) {
  const items = await deps.itemsDe(visitaId);
  const siguiente = items.find((i) => i.estado === "pendiente");

  if (siguiente) {
    await preguntarItem(siguiente, items, tecnico, deps);
    await deps.setEstado(tecnico.id, {
      paso: "checklist",
      visita_id: visitaId,
      item_id: siguiente.id,
    });
    return;
  }
  await cerrarVisita(visitaId, tecnico, deps);
}

async function cerrarVisita(visitaId: string, tecnico: Tecnico, deps: BotDeps) {
  await deps.actualizarVisita(visitaId, {
    estado: "completada",
    completada_at: new Date().toISOString(),
  });

  const visita = await deps.getVisita(visitaId);
  const items = await deps.itemsDe(visitaId);
  const incompletos = items.filter((i) => i.estado === "incompleto").length;
  const observaciones = items.filter((i) => i.estado === "observacion").length;

  let resumen = `Listo ✅ *${visita?.tipos_trabajo.nombre}* en ${visita?.direcciones.direccion} quedó completada.`;
  if (incompletos > 0 || observaciones > 0) {
    resumen += `\n⚠️ Quedó registrado: ${incompletos} punto(s) sin completar y ${observaciones} con observación.`;
  }
  await deps.enviarTexto(tecnico.telefono, resumen);

  await deps.setEstado(tecnico.id, { paso: "menu" });
  await deps.enviarMenu(tecnico.telefono, tecnico.id, deps.hoy(), "¿Seguimos? 💪");
}
