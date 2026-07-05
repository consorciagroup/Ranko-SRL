// Par label/value chico para las fichas del panel de detalle. Evita repetir el
// mismo par de líneas <dt>/<dd> en cada ficha.
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}
