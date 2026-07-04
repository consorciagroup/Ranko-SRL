// ⚠️ TODO(cablear): campana de notificaciones VISUAL. Hoy NO hace nada — es un
// control decorativo para igualar el diseño. Falta cablear el feed de
// notificaciones/alertas (badge de no leídas + panel al clickear). Se usa en
// los headers de todas las páginas del panel.
export function NotificationBell() {
  return (
    <button
      type="button"
      title="Notificaciones — pendiente de cablear"
      aria-label="Notificaciones"
      className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hairline hover:bg-black/[0.04]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
    </button>
  );
}
