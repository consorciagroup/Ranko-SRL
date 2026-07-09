import { describe, expect, it } from "vitest";
import { agruparEnRutas } from "@/app/rutas/agrupar";
import type { Tecnico, VisitaConRelaciones } from "@/lib/types";

function tecnico(id: string, nombre: string): Tecnico {
  return { id, nombre, telefono: "549110000000", activo: true, created_at: "" };
}

function visita(id: string, tecnico_id: string, fecha: string): VisitaConRelaciones {
  return {
    id,
    fecha,
    tecnico_id,
    direccion_id: "dir-1",
    tipo_trabajo_id: "tipo-1",
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
      id: "dir-1",
      direccion: "Av. Corrientes 1234",
      cliente: "Consorcio",
      notas: null,
      activo: true,
      created_at: "",
    },
    tipos_trabajo: { id: "tipo-1", nombre: "Matafuegos", activo: true, created_at: "" },
  };
}

describe("agruparEnRutas", () => {
  it("genera una card por día cuando un técnico tiene paradas en varias fechas", () => {
    const grupos = agruparEnRutas(
      [tecnico("t1", "Juan")],
      [
        visita("v1", "t1", "2026-07-09"),
        visita("v2", "t1", "2026-07-09"),
        visita("v3", "t1", "2026-07-10"),
      ]
    );
    expect(grupos).toHaveLength(2);
    const dia9 = grupos.find((g) => g.fecha === "2026-07-09");
    expect(dia9?.visitas).toHaveLength(2);
    expect(grupos.find((g) => g.fecha === "2026-07-10")?.visitas).toHaveLength(1);
  });

  it("ordena por fecha ascendente y, a igualdad de fecha, alfabéticamente por técnico", () => {
    const grupos = agruparEnRutas(
      [tecnico("t1", "Zoe"), tecnico("t2", "Ana")],
      [
        visita("v1", "t1", "2026-07-10"),
        visita("v2", "t1", "2026-07-09"),
        visita("v3", "t2", "2026-07-09"),
      ]
    );
    expect(grupos.map((g) => [g.fecha, g.tecnico.nombre])).toEqual([
      ["2026-07-09", "Ana"],
      ["2026-07-09", "Zoe"],
      ["2026-07-10", "Zoe"],
    ]);
  });

  it("un técnico sin visitas no genera ningún grupo", () => {
    const grupos = agruparEnRutas(
      [tecnico("t1", "Juan"), tecnico("t2", "Ana")],
      [visita("v1", "t1", "2026-07-09")]
    );
    expect(grupos).toHaveLength(1);
    expect(grupos.every((g) => g.tecnico.id === "t1")).toBe(true);
  });

  it("devuelve un array vacío cuando no hay visitas", () => {
    expect(agruparEnRutas([tecnico("t1", "Juan")], [])).toEqual([]);
  });
});
