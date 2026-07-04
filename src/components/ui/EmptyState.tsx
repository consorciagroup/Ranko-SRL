// Estado vacío unificado. Usa text-neutral-500 (contraste AA sobre blanco;
// neutral-400 no lo cumple) y padding fijo.
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline p-8 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}
