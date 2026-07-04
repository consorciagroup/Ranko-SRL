// Utilidades de formato compartidas entre server y client components.

// Hora local de Buenos Aires (HH:mm) a partir de un timestamp ISO.
export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
}
