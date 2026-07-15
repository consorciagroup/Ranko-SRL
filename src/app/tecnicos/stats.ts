// Forma local del join que alimenta los KPIs de cada tarjeta de técnico.
export type VisitaStat = {
  tecnico_id: string;
  fecha: string;
  direcciones: { cliente: string } | null;
  tipos_trabajo?: { nombre: string } | null;
};

export type TrabajoReciente = { fecha: string; cliente: string; tipoTrabajo: string };

export type StatTecnico = {
  mes: number;
  ultimo: { fecha: string; cliente: string } | null;
  // Últimos trabajos del técnico (más reciente primero), para el modal de edición.
  recientes: TrabajoReciente[];
};

const MAX_RECIENTES = 5;

// Agrega, por técnico, la cantidad de visitas del mes en curso, su "último
// trabajo" y sus últimos `MAX_RECIENTES` trabajos. Asume que `visitas` viene
// ordenada de más reciente a más vieja, así que la primera de cada técnico es
// la más reciente. `mesActual` es "YYYY-MM".
export function calcularStatsTecnicos(
  visitas: VisitaStat[],
  mesActual: string
): Map<string, StatTecnico> {
  const stats = new Map<string, StatTecnico>();
  for (const v of visitas) {
    const s = stats.get(v.tecnico_id) ?? { mes: 0, ultimo: null, recientes: [] };
    if (v.fecha.slice(0, 7) === mesActual) s.mes += 1;
    const cliente = v.direcciones?.cliente ?? "—";
    if (!s.ultimo) {
      s.ultimo = { fecha: v.fecha, cliente };
    }
    if (s.recientes.length < MAX_RECIENTES) {
      s.recientes.push({ fecha: v.fecha, cliente, tipoTrabajo: v.tipos_trabajo?.nombre ?? "—" });
    }
    stats.set(v.tecnico_id, s);
  }
  return stats;
}
