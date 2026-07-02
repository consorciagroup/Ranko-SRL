import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Tecnico, VisitaConRelaciones } from "@/lib/types";
import { DashboardLive } from "./DashboardLive";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
    <div className="max-w-4xl">
      <PageHeader title="Visitas de hoy">
        {new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </PageHeader>
      <div>
        <DashboardLive
          fecha={fecha}
          tecnicos={(tecnicosRes.data ?? []) as Tecnico[]}
          visitasIniciales={(visitasRes.data ?? []) as VisitaConRelaciones[]}
        />
      </div>
    </div>
  );
}
