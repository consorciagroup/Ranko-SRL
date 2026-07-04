import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold text-ink">No encontrado</h1>
      <p className="mt-1 text-sm text-ink-muted">
        La página o el recurso que buscás no existe o fue dado de baja.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm font-semibold text-ranko hover:underline"
      >
        ← Volver al dashboard
      </Link>
    </div>
  );
}
