// StatCard — tile de KPI del dashboard: label arriba + valor grande en fuente
// mono (guiño "panel de monitoreo en vivo"). `alerta` tiñe el valor de rojo y
// pinta un hairline rojo para conteos en riesgo (ej: "Sin acceso").
export function StatCard({
  label,
  valor,
  alerta = false,
}: {
  label: string;
  valor: number | string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl bg-surface p-5 ${
        alerta ? "shadow-[inset_0_0_0_1px_var(--color-ranko)]" : "hairline"
      }`}
    >
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={`font-mono text-4xl font-semibold tabular-nums leading-none ${
          alerta ? "text-ranko" : "text-ink"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}
