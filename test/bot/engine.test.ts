import { beforeEach, describe, expect, it } from "vitest";
import { procesarMensaje } from "@/lib/bot/engine";
import type { BotDeps, MensajeEntrante } from "@/lib/bot/engine";
import type {
  EstadoConversacion,
  Tecnico,
  VisitaItem,
} from "@/lib/types";
import type { VisitaConRelaciones } from "@/lib/bot/menu";

// ---- Deps falsas en memoria ----

const TEL = "5491100000001";
const HOY = "2026-07-02";

interface Enviado {
  tipo: "texto" | "botones" | "menu";
  texto?: string;
  botones?: { id: string; title: string }[];
}

function tecnico(): Tecnico {
  return {
    id: "tec-1",
    nombre: "Juan Pérez",
    telefono: TEL,
    activo: true,
    created_at: "",
  };
}

function visita(
  id: string,
  direccionId: string,
  tipoNombre: string
): VisitaConRelaciones {
  return {
    id,
    fecha: HOY,
    tecnico_id: "tec-1",
    direccion_id: direccionId,
    tipo_trabajo_id: `tipo-${tipoNombre}`,
    orden: 1,
    estado: "asignada",
    con_observacion: false,
    sin_acceso_motivo: null,
    sin_acceso_evidencia_url: null,
    sin_acceso_horario_salida: null,
    iniciada_at: null,
    completada_at: null,
    created_at: "",
    updated_at: "",
    direcciones: {
      id: direccionId,
      direccion: "Av. Corrientes 1234",
      cliente: "Consorcio",
      notas: null,
      activo: true,
      created_at: "",
    },
    tipos_trabajo: {
      id: `tipo-${tipoNombre}`,
      nombre: tipoNombre,
      activo: true,
      created_at: "",
    },
  };
}

function item(
  id: string,
  visitaId: string,
  orden: number,
  tipoDato: VisitaItem["tipo_dato"],
  texto = `Ítem ${orden}`
): VisitaItem {
  return {
    id,
    visita_id: visitaId,
    checklist_item_id: null,
    orden,
    texto,
    tipo_dato: tipoDato,
    obligatorio: true,
    estado: "pendiente",
    valor: null,
    evidencia_url: null,
    motivo: null,
    respondido_at: null,
  };
}

class FakeWorld {
  visitas: VisitaConRelaciones[] = [];
  items: VisitaItem[] = [];
  estado: EstadoConversacion = { paso: "menu" };
  enviados: Enviado[] = [];
  evidenciasGuardadas: string[] = [];

  deps(): BotDeps {
    return {
      hoy: () => HOY,
      getTecnico: async (telefono) => (telefono === TEL ? tecnico() : null),
      getEstado: async () => this.estado,
      setEstado: async (_id, estado) => {
        this.estado = estado;
      },
      visitasPendientes: async () =>
        this.visitas.filter((v) => ["asignada", "en_curso"].includes(v.estado)),
      getVisita: async (id) => this.visitas.find((v) => v.id === id) ?? null,
      actualizarVisita: async (id, patch) => {
        const v = this.visitas.find((x) => x.id === id);
        if (v) Object.assign(v, patch);
      },
      itemsDe: async (visitaId) =>
        this.items
          .filter((i) => i.visita_id === visitaId)
          .sort((a, b) => a.orden - b.orden),
      actualizarItem: async (id, patch) => {
        const i = this.items.find((x) => x.id === id);
        if (i) Object.assign(i, patch);
      },
      guardarEvidencia: async (mediaId, visitaId, itemId) => {
        const url = `https://storage.test/${visitaId}/${itemId}`;
        this.evidenciasGuardadas.push(mediaId);
        return url;
      },
      enviarTexto: async (_tel, texto) => {
        this.enviados.push({ tipo: "texto", texto });
      },
      enviarBotones: async (_tel, texto, botones) => {
        this.enviados.push({ tipo: "botones", texto, botones });
      },
      enviarMenu: async () => {
        this.enviados.push({ tipo: "menu" });
      },
    };
  }

  ultimo(): Enviado {
    return this.enviados[this.enviados.length - 1];
  }
}

function msg(m: Partial<MensajeEntrante>): MensajeEntrante {
  return { telefono: TEL, ...m };
}

// ---- Tests ----

let world: FakeWorld;

beforeEach(() => {
  world = new FakeWorld();
});

describe("registro", () => {
  it("rechaza números no registrados", async () => {
    await procesarMensaje({ telefono: "999", texto: "hola" }, world.deps());
    expect(world.ultimo().tipo).toBe("texto");
    expect(world.ultimo().texto).toContain("no está registrado");
  });
});

describe("paso menu", () => {
  it("cualquier texto muestra el menú de paradas", async () => {
    await procesarMensaje(msg({ texto: "hola" }), world.deps());
    expect(world.ultimo().tipo).toBe("menu");
  });

  it("elegir una parada con una sola visita la inicia y pregunta el primer ítem", async () => {
    world.visitas = [visita("v1", "dir-1", "Recarga de matafuegos")];
    world.items = [item("i1", "v1", 1, "si_no"), item("i2", "v1", 2, "texto")];

    await procesarMensaje(msg({ interactiveId: "parada:dir-1" }), world.deps());

    expect(world.visitas[0].estado).toBe("en_curso");
    expect(world.visitas[0].iniciada_at).not.toBeNull();
    expect(world.estado).toEqual({ paso: "checklist", visita_id: "v1", item_id: "i1" });
    // Primer ítem es si_no → botones
    expect(world.ultimo().tipo).toBe("botones");
    expect(world.ultimo().texto).toContain("(1/2)");
  });

  it("elegir una parada con varios trabajos pide elegir el trabajo", async () => {
    world.visitas = [
      visita("v1", "dir-1", "Recarga de matafuegos"),
      visita("v2", "dir-1", "Limpieza de tanque"),
    ];

    await procesarMensaje(msg({ interactiveId: "parada:dir-1" }), world.deps());

    expect(world.estado).toEqual({ paso: "eligiendo_trabajo", direccion_id: "dir-1" });
    expect(world.ultimo().tipo).toBe("botones");
    expect(world.ultimo().botones?.map((b) => b.id)).toEqual([
      "trabajo:v1",
      "trabajo:v2",
    ]);
  });

  it("una parada sin visitas pendientes reenvía el menú", async () => {
    await procesarMensaje(msg({ interactiveId: "parada:dir-x" }), world.deps());
    expect(world.ultimo().tipo).toBe("menu");
  });
});

describe("paso eligiendo_trabajo", () => {
  it("elegir un trabajo inicia esa visita", async () => {
    world.visitas = [
      visita("v1", "dir-1", "Recarga de matafuegos"),
      visita("v2", "dir-1", "Limpieza de tanque"),
    ];
    world.items = [item("i1", "v2", 1, "texto")];
    world.estado = { paso: "eligiendo_trabajo", direccion_id: "dir-1" };

    await procesarMensaje(msg({ interactiveId: "trabajo:v2" }), world.deps());

    expect(world.visitas.find((v) => v.id === "v2")?.estado).toBe("en_curso");
    expect(world.estado).toEqual({ paso: "checklist", visita_id: "v2", item_id: "i1" });
  });
});

describe("paso checklist", () => {
  beforeEach(() => {
    world.visitas = [visita("v1", "dir-1", "Recarga de matafuegos")];
    world.visitas[0].estado = "en_curso";
  });

  it("responder Sí completa el ítem y pregunta el siguiente", async () => {
    world.items = [item("i1", "v1", 1, "si_no"), item("i2", "v1", 2, "numero")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ interactiveId: "resp:si" }), world.deps());

    expect(world.items[0].estado).toBe("completo");
    expect(world.items[0].valor).toBe("si");
    expect(world.estado).toEqual({ paso: "checklist", visita_id: "v1", item_id: "i2" });
    expect(world.ultimo().texto).toContain("(2/2)");
  });

  it('acepta "sí" por texto en un ítem si_no', async () => {
    world.items = [item("i1", "v1", 1, "si_no"), item("i2", "v1", 2, "texto")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ texto: "Sí" }), world.deps());

    expect(world.items[0].estado).toBe("completo");
    expect(world.items[0].valor).toBe("si");
    expect(world.estado).toEqual({ paso: "checklist", visita_id: "v1", item_id: "i2" });
  });

  it("responder No deja el ítem con observación y marca la visita", async () => {
    world.items = [item("i1", "v1", 1, "si_no"), item("i2", "v1", 2, "texto")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ interactiveId: "resp:no" }), world.deps());

    expect(world.items[0].estado).toBe("observacion");
    expect(world.visitas[0].con_observacion).toBe(true);
  });

  it("un número inválido re-pregunta sin avanzar", async () => {
    world.items = [item("i1", "v1", 1, "numero")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ texto: "doce" }), world.deps());

    expect(world.items[0].estado).toBe("pendiente");
    expect(world.estado).toEqual({ paso: "checklist", visita_id: "v1", item_id: "i1" });
    expect(world.ultimo().texto).toContain("número");
  });

  it("acepta números con coma decimal", async () => {
    world.items = [item("i1", "v1", 1, "numero"), item("i2", "v1", 2, "texto")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ texto: "8,5" }), world.deps());

    expect(world.items[0].valor).toBe("8.5");
    expect(world.items[0].estado).toBe("completo");
  });

  it("una foto guarda la evidencia y completa el ítem", async () => {
    world.items = [item("i1", "v1", 1, "foto"), item("i2", "v1", 2, "texto")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ imagenMediaId: "media-123" }), world.deps());

    expect(world.evidenciasGuardadas).toEqual(["media-123"]);
    expect(world.items[0].estado).toBe("completo");
    expect(world.items[0].evidencia_url).toContain("https://storage.test/");
  });

  it("texto en un ítem de foto re-pregunta", async () => {
    world.items = [item("i1", "v1", 1, "foto")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ texto: "listo" }), world.deps());

    expect(world.items[0].estado).toBe("pendiente");
    expect(world.ultimo().texto).toContain("foto");
  });

  it('"no se puede" pide el motivo', async () => {
    world.items = [item("i1", "v1", 1, "texto")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ texto: "No se puede" }), world.deps());

    expect(world.estado).toEqual({
      paso: "motivo_incompleto",
      visita_id: "v1",
      item_id: "i1",
    });
    expect(world.ultimo().texto).toContain("motivo");
  });

  it("el último ítem cierra la visita y vuelve al menú", async () => {
    world.items = [item("i1", "v1", 1, "texto")];
    world.estado = { paso: "checklist", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ texto: "Todo en orden" }), world.deps());

    expect(world.visitas[0].estado).toBe("completada");
    expect(world.visitas[0].completada_at).not.toBeNull();
    expect(world.estado).toEqual({ paso: "menu" });
    expect(world.ultimo().tipo).toBe("menu");
    const resumen = world.enviados.find((e) => e.texto?.includes("completada"));
    expect(resumen).toBeDefined();
  });
});

describe("paso motivo_incompleto", () => {
  it("guarda el motivo como incompleto y avanza", async () => {
    world.visitas = [visita("v1", "dir-1", "Recarga de matafuegos")];
    world.items = [item("i1", "v1", 1, "foto"), item("i2", "v1", 2, "texto")];
    world.estado = { paso: "motivo_incompleto", visita_id: "v1", item_id: "i1" };

    await procesarMensaje(msg({ texto: "El acceso estaba cerrado" }), world.deps());

    expect(world.items[0].estado).toBe("incompleto");
    expect(world.items[0].motivo).toBe("El acceso estaba cerrado");
    expect(world.visitas[0].con_observacion).toBe(true);
    expect(world.estado).toEqual({ paso: "checklist", visita_id: "v1", item_id: "i2" });
  });
});
