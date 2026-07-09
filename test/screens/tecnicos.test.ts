import { describe, expect, it } from "vitest";
import { calcularStatsTecnicos, type VisitaStat } from "@/app/tecnicos/stats";

function visitaStat(
  tecnico_id: string,
  fecha: string,
  cliente: string | null = "Consorcio"
): VisitaStat {
  return {
    tecnico_id,
    fecha,
    direcciones: cliente === null ? null : { cliente },
  };
}

describe("calcularStatsTecnicos", () => {
  it("cuenta solo las visitas del mes en curso", () => {
    const visitas = [
      visitaStat("t1", "2026-07-08"),
      visitaStat("t1", "2026-07-01"),
      visitaStat("t1", "2026-06-30"), // mes anterior, no cuenta
    ];
    const stats = calcularStatsTecnicos(visitas, "2026-07");
    expect(stats.get("t1")?.mes).toBe(2);
  });

  it("toma como 'último trabajo' la primera visita del técnico (lista ya ordenada desc)", () => {
    const visitas = [
      visitaStat("t1", "2026-07-08", "Consorcio Norte"),
      visitaStat("t1", "2026-07-01", "Consorcio Sur"),
    ];
    const ultimo = calcularStatsTecnicos(visitas, "2026-07").get("t1")?.ultimo;
    expect(ultimo).toEqual({ fecha: "2026-07-08", cliente: "Consorcio Norte" });
  });

  it("usa '—' como cliente cuando la dirección es null", () => {
    const stats = calcularStatsTecnicos([visitaStat("t1", "2026-07-08", null)], "2026-07");
    expect(stats.get("t1")?.ultimo?.cliente).toBe("—");
  });

  it("un técnico sin visitas no aparece en el mapa", () => {
    const stats = calcularStatsTecnicos([visitaStat("t1", "2026-07-08")], "2026-07");
    expect(stats.has("t2")).toBe(false);
  });

  it("separa las stats por técnico", () => {
    const visitas = [
      visitaStat("t1", "2026-07-08"),
      visitaStat("t2", "2026-07-07"),
      visitaStat("t2", "2026-07-06"),
    ];
    const stats = calcularStatsTecnicos(visitas, "2026-07");
    expect(stats.get("t1")?.mes).toBe(1);
    expect(stats.get("t2")?.mes).toBe(2);
  });
});
