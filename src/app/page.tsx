import { supabaseAdmin } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/bot/menu";
import type { Tecnico } from "@/lib/types";
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

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Visitas de hoy</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
      <div className="mt-4">
        <DashboardLive
          fecha={fecha}
          tecnicos={(tecnicosRes.data ?? []) as Tecnico[]}
          visitasIniciales={visitasRes.data ?? []}
        />
      </div>
    </div>
  );
}
