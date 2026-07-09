import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">No encontrado</h1>
      <p className="mt-1 text-sm text-neutral-500">
        La página o el recurso que buscás no existe o fue dado de baja.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-ranko-dark hover:underline"
      >
        ← Volver a Inicio
      </Link>
    </div>
  );
}
