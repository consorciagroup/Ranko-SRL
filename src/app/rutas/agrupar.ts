import type { Tecnico, VisitaConRelaciones } from "@/lib/types";

export type Grupo = {
  tecnico: Tecnico;
  fecha: string;
  visitas: VisitaConRelaciones[];
};

// Una tarjeta por técnico + fecha (un técnico con paradas en varios días aparece
// una vez por día), ordenadas cronológicamente (la más próxima primero) y, a
// igualdad de fecha, alfabéticamente por nombre de técnico. Función pura.
export function agruparEnRutas(
  tecnicos: Tecnico[],
  visitas: VisitaConRelaciones[]
): Grupo[] {
  const porTecnico = new Map<string, VisitaConRelaciones[]>();
  for (const v of visitas) {
    const grupo = porTecnico.get(v.tecnico_id) ?? [];
    grupo.push(v);
    porTecnico.set(v.tecnico_id, grupo);
  }

  const grupos: Grupo[] = [];
  for (const t of tecnicos) {
    const porFecha = new Map<string, VisitaConRelaciones[]>();
    for (const v of porTecnico.get(t.id) ?? []) {
      const arr = porFecha.get(v.fecha) ?? [];
      arr.push(v);
      porFecha.set(v.fecha, arr);
    }
    for (const [fecha, vs] of porFecha) {
      grupos.push({ tecnico: t, fecha, visitas: vs });
    }
  }
  grupos.sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      a.tecnico.nombre.localeCompare(b.tecnico.nombre)
  );
  return grupos;
}
