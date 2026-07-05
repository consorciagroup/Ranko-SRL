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
    <div className="flex h-9 w-64 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 shadow-sm transition-colors focus-within:border-neutral-400">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-4 w-4 shrink-0 text-neutral-400"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
        />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus
        className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400"
        style={{ outline: "none" }}
      />
    </div>
  );
}
