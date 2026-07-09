// Forma local del join que alimenta los KPIs de cada tarjeta de técnico.
export type VisitaStat = {
  tecnico_id: string;
  fecha: string;
  direcciones: { cliente: string } | null;
};

export type StatTecnico = {
  mes: number;
  ultimo: { fecha: string; cliente: string } | null;
};

// Agrega, por técnico, la cantidad de visitas del mes en curso y su "último
// trabajo". Asume que `visitas` viene ordenada de más reciente a más vieja, así
// que la primera de cada técnico es la más reciente. `mesActual` es "YYYY-MM".
export function calcularStatsTecnicos(
  visitas: VisitaStat[],
  mesActual: string
): Map<string, StatTecnico> {
  const stats = new Map<string, StatTecnico>();
  for (const v of visitas) {
    const s = stats.get(v.tecnico_id) ?? { mes: 0, ultimo: null };
    if (v.fecha.slice(0, 7) === mesActual) s.mes += 1;
    if (!s.ultimo) {
      s.ultimo = { fecha: v.fecha, cliente: v.direcciones?.cliente ?? "—" };
    }
    stats.set(v.tecnico_id, s);
  }
  return stats;
}
