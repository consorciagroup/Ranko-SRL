import type { Tecnico, VisitaConRelaciones } from "@/lib/types";

export interface EstadoDashboard {
  porTecnico: Map<string, VisitaConRelaciones[]>;
  tecnicosConVisitas: Tecnico[];
  totales: {
    total: number;
    completadas: number;
    enCurso: number;
    sinAcceso: number;
  };
  atrasadas: VisitaConRelaciones[];
  conObservacion: VisitaConRelaciones[];
  sinAcceso: VisitaConRelaciones[];
  totalAlertas: number;
}

// Estado derivado del dashboard del día: agrupa las visitas por técnico, cuenta
// los totales por estado y arma las tres listas de alertas. Función pura: recibe
// las visitas y los técnicos, no toca I/O ni el DOM.
export function calcularEstadoDashboard(
  visitas: VisitaConRelaciones[],
  tecnicos: Tecnico[]
): EstadoDashboard {
  const porTecnico = new Map<string, VisitaConRelaciones[]>();
  for (const v of visitas) {
    const grupo = porTecnico.get(v.tecnico_id) ?? [];
    grupo.push(v);
    porTecnico.set(v.tecnico_id, grupo);
  }

  const totales = {
    total: visitas.length,
    completadas: visitas.filter((v) =>
      ["completada", "en_revision", "aprobada"].includes(v.estado)
    ).length,
    enCurso: visitas.filter((v) => v.estado === "en_curso").length,
    sinAcceso: visitas.filter((v) => v.estado === "sin_acceso").length,
  };

  // Alertas: asignadas sin iniciar (atraso) + con observación + sin acceso.
  const atrasadas = visitas.filter((v) => v.estado === "asignada" && !v.iniciada_at);
  const conObservacion = visitas.filter((v) => v.con_observacion);
  const sinAcceso = visitas.filter((v) => v.estado === "sin_acceso");
  const totalAlertas = atrasadas.length + conObservacion.length + sinAcceso.length;

  const tecnicosConVisitas = tecnicos.filter((t) => porTecnico.has(t.id));

  return {
    porTecnico,
    tecnicosConVisitas,
    totales,
    atrasadas,
    conObservacion,
    sinAcceso,
    totalAlertas,
  };
}
