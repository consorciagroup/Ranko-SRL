import { describe, expect, it } from "vitest";
import { formatHora, formatFecha, fechaRelativa } from "@/lib/format";

describe("formatHora", () => {
  it("devuelve la hora local de Buenos Aires (UTC-3), no la UTC", () => {
    // 15:30 UTC → 12:30 en Buenos Aires (no 15:30)
    expect(formatHora("2026-07-04T15:30:00Z")).toContain("12:30");
  });

  it("convierte correctamente un timestamp de madrugada UTC al día anterior local", () => {
    // 01:00 UTC → 22:00 del día anterior en Buenos Aires
    expect(formatHora("2026-07-04T01:00:00Z")).toContain("10:00");
  });
});

describe("formatFecha", () => {
  it("no corre el día por el huso horario (ancla en T12:00:00)", () => {
    // El día debe ser 15, nunca 14 ni 16.
    const salida = formatFecha("2026-01-15");
    expect(salida.startsWith("15 ")).toBe(true);
    expect(salida).toContain("2026");
  });

  it("formatea el primero de mes sin corrimiento", () => {
    const salida = formatFecha("2026-03-01");
    expect(salida.startsWith("1 ")).toBe(true);
    expect(salida).toContain("2026");
  });
});

describe("fechaRelativa", () => {
  it("devuelve 'hoy' cuando la fecha coincide con hoy", () => {
    expect(fechaRelativa("2026-07-09", "2026-07-09")).toBe("hoy");
  });

  it("devuelve 'ayer' cruzando el fin de mes", () => {
    expect(fechaRelativa("2026-02-28", "2026-03-01")).toBe("ayer");
  });

  it("devuelve 'ayer' en un día normal", () => {
    expect(fechaRelativa("2026-07-08", "2026-07-09")).toBe("ayer");
  });

  it("devuelve el formato día/mes para una fecha lejana", () => {
    // Ni "hoy" ni "ayer": muestra día/mes (día primero, formato es-AR).
    expect(fechaRelativa("2026-12-25", "2026-07-09")).toBe("25/12");
  });
});
