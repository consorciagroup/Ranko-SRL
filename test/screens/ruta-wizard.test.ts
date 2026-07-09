import { describe, expect, it } from "vitest";
import { calcularProgresoWizard } from "@/app/rutas/nueva/wizard-logic";

describe("calcularProgresoWizard — validación por paso", () => {
  it("paso 1: no puede continuar sin técnico, sí con técnico", () => {
    expect(
      calcularProgresoWizard({ step: 1, tecnicoId: null, dirIds: [], tiposPorDir: {} }).canContinue
    ).toBe(false);
    expect(
      calcularProgresoWizard({ step: 1, tecnicoId: "t1", dirIds: [], tiposPorDir: {} }).canContinue
    ).toBe(true);
  });

  it("paso 2: requiere al menos una dirección", () => {
    expect(
      calcularProgresoWizard({ step: 2, tecnicoId: "t1", dirIds: [], tiposPorDir: {} }).canContinue
    ).toBe(false);
    expect(
      calcularProgresoWizard({ step: 2, tecnicoId: "t1", dirIds: ["d1"], tiposPorDir: {} }).canContinue
    ).toBe(true);
  });

  it("paso 3: cada dirección seleccionada requiere al menos un tipo de trabajo", () => {
    // d2 sin tipos → no puede continuar
    expect(
      calcularProgresoWizard({
        step: 3,
        tecnicoId: "t1",
        dirIds: ["d1", "d2"],
        tiposPorDir: { d1: ["tipo-1"] },
      }).canContinue
    ).toBe(false);
    // todas con al menos un tipo → puede continuar
    expect(
      calcularProgresoWizard({
        step: 3,
        tecnicoId: "t1",
        dirIds: ["d1", "d2"],
        tiposPorDir: { d1: ["tipo-1"], d2: ["tipo-2"] },
      }).canContinue
    ).toBe(true);
  });

  it("paso 4: siempre puede continuar", () => {
    expect(
      calcularProgresoWizard({ step: 4, tecnicoId: "t1", dirIds: ["d1"], tiposPorDir: { d1: ["tipo-1"] } }).canContinue
    ).toBe(true);
  });
});

describe("calcularProgresoWizard — conteo de visitas", () => {
  it("suma un total igual a la cantidad de tipos elegidos en todas las direcciones", () => {
    const { totalVisitas } = calcularProgresoWizard({
      step: 4,
      tecnicoId: "t1",
      dirIds: ["d1", "d2"],
      tiposPorDir: { d1: ["tipo-1", "tipo-2"], d2: ["tipo-1"] },
    });
    expect(totalVisitas).toBe(3);
  });

  it("no cuenta tipos de direcciones que no están seleccionadas", () => {
    const { totalVisitas } = calcularProgresoWizard({
      step: 4,
      tecnicoId: "t1",
      dirIds: ["d1"],
      tiposPorDir: { d1: ["tipo-1"], d2: ["tipo-1", "tipo-2"] },
    });
    expect(totalVisitas).toBe(1);
  });

  it("total cero cuando no hay tipos elegidos", () => {
    const { totalVisitas } = calcularProgresoWizard({
      step: 2,
      tecnicoId: "t1",
      dirIds: ["d1", "d2"],
      tiposPorDir: {},
    });
    expect(totalVisitas).toBe(0);
  });
});
