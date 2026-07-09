import { describe, expect, it } from "vitest";
import { calcularEstadoDashboard } from "@/app/dashboard-stats";
import type { EstadoVisita, Tecnico, VisitaConRelaciones } from "@/lib/types";

function tecnico(id: string, nombre: string): Tecnico {
  return { id, nombre, telefono: "549110000000", activo: true, created_at: "" };
}

function visita(
  overrides: Partial<VisitaConRelaciones> & { id: string; tecnico_id: string }
): VisitaConRelaciones {
  const estado: EstadoVisita = overrides.estado ?? "asignada";
  return {
    id: overrides.id,
    fecha: "2026-07-09",
    tecnico_id: overrides.tecnico_id,
    direccion_id: overrides.direccion_id ?? "dir-1",
    tipo_trabajo_id: "tipo-1",
    orden: 1,
    estado,
    con_observacion: overrides.con_observacion ?? false,
    sin_acceso_motivo: null,
    sin_acceso_evidencia_url: null,
    sin_acceso_horario_salida: null,
    iniciada_at: overrides.iniciada_at ?? null,
    completada_at: overrides.completada_at ?? null,
    created_at: "",
    updated_at: "",
    direcciones: {
      id: overrides.direccion_id ?? "dir-1",
      direccion: "Av. Corrientes 1234",
      cliente: "Consorcio",
      notas: null,
      activo: true,
      created_at: "",
    },
    tipos_trabajo: {
      id: "tipo-1",
      nombre: "Matafuegos",
      activo: true,
      created_at: "",
    },
  };
}

describe("calcularEstadoDashboard", () => {
  it("cuenta los totales por estado (completadas agrupa completada/en_revision/aprobada)", () => {
    const visitas = [
      visita({ id: "v1", tecnico_id: "t1", estado: "completada" }),
      visita({ id: "v2", tecnico_id: "t1", estado: "en_revision" }),
      visita({ id: "v3", tecnico_id: "t1", estado: "aprobada" }),
      visita({ id: "v4", tecnico_id: "t1", estado: "en_curso", iniciada_at: "2026-07-09T12:00:00Z" }),
      visita({ id: "v5", tecnico_id: "t1", estado: "sin_acceso" }),
      visita({ id: "v6", tecnico_id: "t1", estado: "asignada" }),
    ];
    const { totales } = calcularEstadoDashboard(visitas, [tecnico("t1", "Juan")]);
    expect(totales.total).toBe(6);
    expect(totales.completadas).toBe(3);
    expect(totales.enCurso).toBe(1);
    expect(totales.sinAcceso).toBe(1);
  });

  it("marca como atrasada una visita asignada sin iniciar, pero no una asignada ya iniciada", () => {
    const visitas = [
      visita({ id: "v1", tecnico_id: "t1", estado: "asignada", iniciada_at: null }),
      visita({ id: "v2", tecnico_id: "t1", estado: "asignada", iniciada_at: "2026-07-09T12:00:00Z" }),
    ];
    const { atrasadas } = calcularEstadoDashboard(visitas, [tecnico("t1", "Juan")]);
    expect(atrasadas.map((v) => v.id)).toEqual(["v1"]);
  });

  it("acumula alertas cuando una misma visita cumple varios criterios a la vez", () => {
    // Sin acceso Y con observación: cuenta en ambas listas de alertas.
    const visitas = [
      visita({ id: "v1", tecnico_id: "t1", estado: "sin_acceso", con_observacion: true }),
    ];
    const { conObservacion, sinAcceso, totalAlertas } = calcularEstadoDashboard(
      visitas,
      [tecnico("t1", "Juan")]
    );
    expect(sinAcceso.map((v) => v.id)).toEqual(["v1"]);
    expect(conObservacion.map((v) => v.id)).toEqual(["v1"]);
    expect(totalAlertas).toBe(2);
  });

  it("agrupa por técnico y solo incluye técnicos con visitas", () => {
    const visitas = [
      visita({ id: "v1", tecnico_id: "t1" }),
      visita({ id: "v2", tecnico_id: "t1" }),
    ];
    const { porTecnico, tecnicosConVisitas } = calcularEstadoDashboard(visitas, [
      tecnico("t1", "Juan"),
      tecnico("t2", "Ana"),
    ]);
    expect(porTecnico.get("t1")).toHaveLength(2);
    expect(tecnicosConVisitas.map((t) => t.id)).toEqual(["t1"]);
  });

  it("no genera alertas cuando todo está en horario", () => {
    const visitas = [
      visita({ id: "v1", tecnico_id: "t1", estado: "completada" }),
      visita({ id: "v2", tecnico_id: "t1", estado: "asignada", iniciada_at: "2026-07-09T10:00:00Z" }),
    ];
    const { totalAlertas } = calcularEstadoDashboard(visitas, [tecnico("t1", "Juan")]);
    expect(totalAlertas).toBe(0);
  });
});
