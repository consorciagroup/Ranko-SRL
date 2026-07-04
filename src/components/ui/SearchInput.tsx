// ⚠️ TODO(cablear): buscador VISUAL del panel. Hoy NO filtra nada — es un
// control decorativo para igualar el diseño. Falta cablear la búsqueda real
// (por reporte / cliente / técnico) donde se use: Dashboard, Rutas, Técnicos,
// Direcciones y Catálogo. Cuando se cablee, convertir en client component con
// estado + debounce y filtrar el listado correspondiente.
export function SearchInput({
  placeholder = "Buscar…",
}: {
  placeholder?: string;
}) {
  return (
    <div className="flex h-10 w-64 items-center gap-2 rounded-md bg-surface px-3.5 hairline">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-4 w-4 shrink-0 text-ink-muted"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
        />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        // Pendiente de cablear: por ahora no dispara ninguna búsqueda.
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
    </div>
  );
}
