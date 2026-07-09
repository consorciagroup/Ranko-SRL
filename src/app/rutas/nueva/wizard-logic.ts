// Estado derivado del asistente de nueva ruta: cuántas visitas se van a crear y
// si el paso actual habilita el botón "Continuar". Función pura sobre el estado
// del wizard (paso, técnico elegido, direcciones y tipos de trabajo por dirección).
export function calcularProgresoWizard({
  step,
  tecnicoId,
  dirIds,
  tiposPorDir,
}: {
  step: number;
  tecnicoId: string | null;
  dirIds: string[];
  tiposPorDir: Record<string, string[]>;
}): { totalVisitas: number; canContinue: boolean } {
  const totalVisitas = dirIds.reduce(
    (n, id) => n + (tiposPorDir[id]?.length ?? 0),
    0
  );

  const canContinue =
    step === 1
      ? !!tecnicoId
      : step === 2
        ? dirIds.length > 0
        : step === 3
          ? dirIds.every((id) => (tiposPorDir[id]?.length ?? 0) > 0)
          : true;

  return { totalVisitas, canContinue };
}
