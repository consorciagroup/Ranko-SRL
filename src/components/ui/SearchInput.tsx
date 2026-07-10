// Buscador del panel. Es funcional cuando se le pasa `onChange` (el padre — un
// client component — maneja el estado y filtra el listado; ver ReportesFiltros).
// Sin `onChange` queda decorativo, que es como sigue hoy en Inicio, Rutas,
// Técnicos, Direcciones y Catálogo hasta que se cablee cada uno.
export function SearchInput({
  placeholder = "Buscar…",
  defaultValue,
  onChange,
}: {
  placeholder?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
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
        defaultValue={defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400"
        style={{ outline: "none" }}
      />
    </div>
  );
}
