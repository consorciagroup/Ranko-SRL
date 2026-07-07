import { supabaseAdmin } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Tecnico } from "@/lib/types";
import { SimuladorChat } from "./SimuladorChat";

export const dynamic = "force-dynamic";

// Ruta oculta (sin link en el sidebar): entorno interno para probar el flujo
// del bot de WhatsApp sin salir del panel. Corre sobre datos reales.
export default async function SimuladorPage() {
  const { data, error } = await supabaseAdmin()
    .from("tecnicos")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  const tecnicos = (data ?? []) as Tecnico[];

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader title="Simulador del bot">
        Probá el flujo de WhatsApp del técnico sin usar el teléfono. Corre sobre
        los datos reales: elegí un técnico y conversá con el bot como si fueras
        él. Usá <span className="font-medium text-ink">Reiniciar</span> para
        volver a dejar sus visitas de hoy en cero y arrancar de nuevo.
      </PageHeader>

      {tecnicos.length > 0 ? (
        <SimuladorChat tecnicos={tecnicos} />
      ) : (
        <EmptyState>
          No hay técnicos activos. Cargá uno en Técnicos para poder simular.
        </EmptyState>
      )}
    </div>
  );
}
