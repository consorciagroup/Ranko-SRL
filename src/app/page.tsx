import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Tecnico, VisitaConRelaciones } from "@/lib/types";
import { DashboardLive } from "./DashboardLive";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tecnico?: string; visita?: string }>;
}) {
  const { tecnico: tecnicoSeleccionadoId, visita: visitaSeleccionadaId } =
    await searchParams;
  const fecha = hoyISO();
  const db = supabaseAdmin();
  const [tecnicosRes, visitasRes] = await Promise.all([
    db.from("tecnicos").select("*").eq("activo", true).order("nombre"),
    db
      .from("visitas")
      .select("*, direcciones(*), tipos_trabajo(*)")
      .eq("fecha", fecha)
      .order("orden"),
  ]);
  if (tecnicosRes.error) throw new Error(tecnicosRes.error.message);
  if (visitasRes.error) throw new Error(visitasRes.error.message);

  return (
    <div className="max-w-7xl">
      <PageHeader title="Visitas de hoy">
        {new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </PageHeader>
      <DashboardLive
        fecha={fecha}
        tecnicos={(tecnicosRes.data ?? []) as Tecnico[]}
        visitasIniciales={(visitasRes.data ?? []) as VisitaConRelaciones[]}
        tecnicoSeleccionadoId={tecnicoSeleccionadoId}
        visitaSeleccionadaId={visitaSeleccionadaId}
      />
    </div>
  );
}
