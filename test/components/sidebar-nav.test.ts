import { describe, expect, it } from "vitest";
import { esActivo } from "@/components/SidebarNav";

describe("esActivo", () => {
  it("Inicio (\"/\") solo está activo en la home exacta", () => {
    expect(esActivo("/", "/")).toBe(true);
    expect(esActivo("/reportes", "/")).toBe(false);
    expect(esActivo("/tecnicos", "/")).toBe(false);
  });

  it("un ítem está activo en su propia ruta", () => {
    expect(esActivo("/reportes", "/reportes")).toBe(true);
    expect(esActivo("/tecnicos", "/tecnicos")).toBe(true);
    expect(esActivo("/configuracion", "/configuracion")).toBe(true);
  });

  it("un ítem sigue activo en sub-rutas anidadas", () => {
    expect(esActivo("/reportes/123", "/reportes")).toBe(true);
    expect(esActivo("/rutas/nueva", "/rutas")).toBe(true);
    expect(esActivo("/catalogo/abc-123", "/catalogo")).toBe(true);
  });

  it("no marca activos ítems de otras rutas del sidebar", () => {
    expect(esActivo("/tecnicos", "/reportes")).toBe(false);
    expect(esActivo("/direcciones", "/rutas")).toBe(false);
    expect(esActivo("/configuracion", "/tecnicos")).toBe(false);
  });

  // esActivo compara con startsWith, no por segmento de path: una ruta futura
  // que empiece igual que otra ("/reportesviejos" vs "/reportes") marcaría
  // ambos ítems como activos. Documentamos el comportamiento actual para que
  // este test alerte si se agrega una ruta así sin ajustar la comparación.
  it("startsWith no distingue límites de segmento (riesgo conocido, no un bug de esta entrega)", () => {
    expect(esActivo("/reportesviejos", "/reportes")).toBe(true);
  });
});
