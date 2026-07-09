import { SearchInput } from "./SearchInput";
import { NotificationBell } from "./NotificationBell";

// Encabezado de página unificado (título + descripción opcional). El slot
// `actions` permite meter controles a la derecha (ej: el botón de alta o el
// selector de día en Rutas). Con `search` se muestran además el buscador y la
// campana del diseño — ojo: son visuales, todavía sin cablear (ver SearchInput
// y NotificationBell).
export function PageHeader({
  title,
  children,
  actions,
  search = false,
  bell = search,
  searchPlaceholder,
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  search?: boolean;
  bell?: boolean;
  searchPlaceholder?: string;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {children && (
          <p className="mt-2 max-w-2xl text-base text-ink-muted">{children}</p>
        )}
      </div>
      {(search || bell || actions) && (
        <div className="flex shrink-0 items-center gap-3">
          {search && <SearchInput placeholder={searchPlaceholder} />}
          {bell && <NotificationBell />}
          {actions}
        </div>
      )}
    </header>
  );
}
