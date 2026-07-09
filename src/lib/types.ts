// Tipos del modelo de datos. Espejo de supabase/migrations/20260702000001_modelo_inicial.sql.
// Cuando exista el proyecto Supabase de Ranko, se pueden regenerar con
// `supabase gen types typescript` — por ahora se mantienen a mano.

export type TipoDato = "si_no" | "texto" | "foto" | "numero";

export type EstadoVisita =
  | "asignada"
  | "en_curso"
  | "completada"
  | "en_revision"
  | "aprobada"
  | "sin_acceso";

export type EstadoItem = "pendiente" | "completo" | "incompleto" | "observacion";

export interface Tecnico {
  id: string;
  nombre: string;
  telefono: string;
  activo: boolean;
  created_at: string;
}

export interface Direccion {
  id: string;
  direccion: string;
  cliente: string;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

export interface TipoTrabajo {
  id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  tipo_trabajo_id: string;
  orden: number;
  texto: string;
  tipo_dato: TipoDato;
  obligatorio: boolean;
  created_at: string;
}

export interface Visita {
  id: string;
  fecha: string;
  tecnico_id: string;
  direccion_id: string;
  tipo_trabajo_id: string;
  orden: number;
  estado: EstadoVisita;
  con_observacion: boolean;
  sin_acceso_motivo: string | null;
  sin_acceso_evidencia_url: string | null;
  sin_acceso_horario_salida: string | null;
  iniciada_at: string | null;
  completada_at: string | null;
  created_at: string;
  updated_at: string;
}

// Visita con sus relaciones embebidas (join de Supabase). Es la forma en que
// llega una fila de `visitas` cuando se selecciona con `direcciones(*), tipos_trabajo(*)`.
export type VisitaConRelaciones = Visita & {
  direcciones: Direccion;
  tipos_trabajo: TipoTrabajo;
};

export interface VisitaItem {
  id: string;
  visita_id: string;
  checklist_item_id: string | null;
  orden: number;
  texto: string;
  tipo_dato: TipoDato;
  obligatorio: boolean;
  estado: EstadoItem;
  valor: string | null;
  evidencia_url: string | null;
  motivo: string | null;
  respondido_at: string | null;
}

export interface Conversacion {
  tecnico_id: string;
  estado: EstadoConversacion;
  updated_at: string;
}

// ---- Estado de la máquina de estados del bot (columna jsonb `conversaciones.estado`) ----

export type EstadoConversacion =
  // Sin flujo activo: el próximo mensaje muestra/re-muestra el menú de paradas
  | { paso: "menu" }
  // Eligió una parada con más de un trabajo: tiene que elegir cuál hacer
  | { paso: "eligiendo_trabajo"; direccion_id: string }
  // Ejecutando el checklist de una visita, ítem por ítem
  | { paso: "checklist"; visita_id: string; item_id: string }
  // El ítem no se pudo completar: esperando el motivo
  | { paso: "motivo_incompleto"; visita_id: string; item_id: string };

export const ESTADO_VISITA_LABEL: Record<EstadoVisita, string> = {
  asignada: "Asignada",
  en_curso: "En curso",
  completada: "Completada",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  sin_acceso: "Sin acceso",
};

export const TIPO_DATO_LABEL: Record<TipoDato, string> = {
  si_no: "Sí / No",
  texto: "Texto libre",
  foto: "Foto",
  numero: "Medición numérica",
};

// ---- Reportes (compilación de visitas de una dirección en un período) ----

export type EstadoReporte = "borrador" | "finalizado";

export interface Reporte {
  id: string;
  direccion_id: string;
  titulo: string;
  periodo_desde: string;
  periodo_hasta: string;
  // Texto manual por ahora; más adelante lo redacta la IA.
  resumen: string | null;
  cierre: string | null;
  estado: EstadoReporte;
  created_at: string;
  updated_at: string;
}

export interface ReporteVisita {
  id: string;
  reporte_id: string;
  visita_id: string;
  orden: number;
}

export const ESTADO_REPORTE_LABEL: Record<EstadoReporte, string> = {
  borrador: "Borrador",
  finalizado: "Finalizado",
};
