// Utilidades de formato compartidas entre server y client components.

// Normaliza los espacios que mete Intl (no-break U+00A0, narrow no-break U+202F,
// etc.) a un espacio común. El ICU de Node y el de los navegadores no siempre
// eligen el mismo carácter de espacio (ej: antes del "p. m."), y esa diferencia
// invisible rompía la hidratación de React en los componentes cliente que
// formatean horas/fechas. Colapsar a " " garantiza el mismo string en ambos.
function normalizarEspacios(texto: string): string {
  return texto.replace(/\s+/g, " ");
}

// Hora local de Buenos Aires (HH:mm) a partir de un timestamp ISO.
export function formatHora(iso: string): string {
  return normalizarEspacios(
    new Date(iso).toLocaleTimeString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
}

// Fecha corta (ej: "4 jul 2026") a partir de un "YYYY-MM-DD". El T12:00:00
// evita que el cambio de huso corra la fecha un día para atrás/adelante.
export function formatFecha(fecha: string): string {
  return normalizarEspacios(
    new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  );
}

// Fecha relativa amigable: "hoy" / "ayer" / "dd/mm" — para metadatos compactos
// tipo "Último trabajo". `hoy` es el "YYYY-MM-DD" de referencia (hoyISO()).
export function fechaRelativa(fecha: string, hoy: string): string {
  if (fecha === hoy) return "hoy";
  const ayer = new Date(`${hoy}T12:00:00`);
  ayer.setDate(ayer.getDate() - 1);
  if (fecha === ayer.toISOString().slice(0, 10)) return "ayer";
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}
