// Card de sección para pantallas de configuración: título + descripción
// opcional + contenido. Una sola responsabilidad, igual que StatCard/Field.
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-6 hairline">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
