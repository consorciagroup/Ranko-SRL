import { supabaseAdmin } from "@/lib/supabase/server";
import { sendList, sendText } from "@/lib/whatsapp";
import type { VisitaConRelaciones } from "@/lib/types";

// Tipo canónico definido en @/lib/types; se re-exporta acá para no romper los
// imports existentes del bot (`from "./menu"`).
export type { VisitaConRelaciones };

export function hoyISO(): string {
  // Fecha operativa en hora de Buenos Aires, no UTC (a la noche difieren)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

export async function visitasPendientesDe(
  tecnicoId: string,
  fecha: string
): Promise<VisitaConRelaciones[]> {
  const { data, error } = await supabaseAdmin()
    .from("visitas")
    .select("*, direcciones(*), tipos_trabajo(*)")
    .eq("tecnico_id", tecnicoId)
    .eq("fecha", fecha)
    .in("estado", ["asignada", "en_curso"])
    .order("orden");
  if (error) throw new Error(error.message);
  return (data ?? []) as VisitaConRelaciones[];
}

// Menú de paradas: una fila por dirección (la "parada" es agrupación visual;
// los trabajos de esa dirección se eligen en el paso siguiente).
export async function enviarMenuParadas(
  telefono: string,
  tecnicoId: string,
  fecha: string,
  encabezado?: string
): Promise<void> {
  const visitas = await visitasPendientesDe(tecnicoId, fecha);

  if (visitas.length === 0) {
    await sendText(
      telefono,
      "No te quedan visitas pendientes por hoy. ¡Buen trabajo! 👏"
    );
    return;
  }

  const paradas = new Map<string, VisitaConRelaciones[]>();
  for (const v of visitas) {
    const grupo = paradas.get(v.direccion_id) ?? [];
    grupo.push(v);
    paradas.set(v.direccion_id, grupo);
  }

  // La lista interactiva de WhatsApp admite hasta 10 filas
  const filas = [...paradas.entries()].slice(0, 10).map(([direccionId, grupo]) => ({
    id: `parada:${direccionId}`,
    title: grupo[0].direcciones.direccion,
    description: grupo.map((v) => v.tipos_trabajo.nombre).join(" + "),
  }));

  const body =
    (encabezado ?? `Estas son tus paradas pendientes (${paradas.size}):`) +
    "\n\nElegí por cuál seguir — el orden lo manejás vos.";

  await sendList(telefono, {
    body,
    buttonText: "Ver paradas",
    sections: [{ title: "Paradas de hoy", rows: filas }],
  });
}
