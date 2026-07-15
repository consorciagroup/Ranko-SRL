import Link from "next/link";
import { EmptyState } from "./EmptyState";

// Panel de detalle fijo a la derecha, compartido por las 5 páginas. Sin
// "use client": se usa tanto desde server components como desde DashboardLive
// (client). Siempre montado; muestra el emptyMessage cuando no hay `children`.
export function DetailPanel({
  title,
  closeHref,
  emptyMessage,
  actions,
  children,
}: {
  title?: string;
  closeHref?: string;
  emptyMessage: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <aside className="sticky top-8 flex max-h-[calc(100vh-4rem)] w-96 shrink-0 flex-col self-start overflow-hidden rounded-xl bg-surface hairline">
      {children ? (
        <>
          <header className="flex items-center justify-between gap-2 px-4 py-3 shadow-[inset_0_-1px_0_var(--color-hairline)]">
            <h2 className="min-w-0 truncate font-display font-bold text-ink">
              {title}
            </h2>
            <div className="flex shrink-0 items-center gap-3">
              {actions}
              {closeHref && (
                <Link
                  href={closeHref}
                  scroll={false}
                  aria-label="Cerrar panel"
                  className="rounded-md p-1 text-ink-muted hover:bg-black/[0.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ranko/40"
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
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </>
      ) : (
        <EmptyState>{emptyMessage}</EmptyState>
      )}
    </aside>
  );
}
