import { describe, expect, it } from "vitest";
import { agruparEnParadas, hoyISO } from "@/lib/bot/menu";
import type { VisitaConRelaciones } from "@/lib/types";

// Builder local de visitas con relaciones embebidas para armar el menú.
function visita(
  id: string,
  direccionId: string,
  direccion: string,
  tipoNombre: string
): VisitaConRelaciones {
  return {
    id,
    fecha: "2026-07-02",
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
      direccion,
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

describe("hoyISO", () => {
  it("devuelve la fecha en formato YYYY-MM-DD", () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("agruparEnParadas", () => {
  it("arma una fila por dirección", () => {
    const filas = agruparEnParadas([
      visita("v1", "dir-1", "Av. Corrientes 1234", "Matafuegos"),
      visita("v2", "dir-2", "Av. Rivadavia 5000", "Tanque"),
    ]);
    expect(filas).toHaveLength(2);
    expect(filas[0]).toEqual({
      id: "parada:dir-1",
      title: "Av. Corrientes 1234",
      description: "Matafuegos",
    });
  });

  it("agrupa varias visitas de la misma dirección en una fila con los trabajos concatenados", () => {
    const filas = agruparEnParadas([
      visita("v1", "dir-1", "Av. Corrientes 1234", "Matafuegos"),
      visita("v2", "dir-1", "Av. Corrientes 1234", "Tanque"),
    ]);
    expect(filas).toHaveLength(1);
    expect(filas[0].id).toBe("parada:dir-1");
    expect(filas[0].description).toBe("Matafuegos + Tanque");
  });

  it("trunca a 10 filas cuando hay más de 10 direcciones distintas", () => {
    const visitas = Array.from({ length: 13 }, (_, i) =>
      visita(`v${i}`, `dir-${i}`, `Calle ${i}`, "Trabajo")
    );
    const filas = agruparEnParadas(visitas);
    expect(filas).toHaveLength(10);
    // Conserva el orden de aparición: las primeras 10 direcciones.
    expect(filas[0].id).toBe("parada:dir-0");
    expect(filas[9].id).toBe("parada:dir-9");
  });

  it("devuelve un array vacío cuando no hay visitas", () => {
    expect(agruparEnParadas([])).toEqual([]);
  });
});
