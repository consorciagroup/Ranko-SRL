// Encabezado de página unificado (título + descripción opcional). El slot
// `actions` permite meter controles a la derecha (ej: el selector de día en Rutas).
export function PageHeader({
  title,
  children,
  actions,
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          {title}
        </h1>
        {children && (
          <p className="mt-2 max-w-2xl text-base text-neutral-500">{children}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
