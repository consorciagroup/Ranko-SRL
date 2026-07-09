import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import type { Tecnico } from "@/lib/types";

export const dynamic = "force-dynamic";

// Hub del simulador (ruta oculta, sin link en el sidebar). Cada técnico tiene su
// propia "pestaña" (/simulador/[id]) que funciona como su WhatsApp: abrí una por
// técnico y, al mandar la ruta desde Rutas, el mensaje aparece en la suya.
export default async function SimuladorHubPage() {
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
        Probá el flujo de WhatsApp sin usar el teléfono. Cada técnico tiene su
        propia pantalla, como si fuera su chat. Abrí la de un técnico y mandale
        la ruta desde <span className="font-medium text-ink">Rutas</span> — el
        mensaje del bot le va a llegar acá.
      </PageHeader>

      {tecnicos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {tecnicos.map((t) => (
            <Link
              key={t.id}
              href={`/simulador/${t.id}`}
              className="flex items-center gap-3 rounded-xl bg-surface p-5 hairline transition-colors hover:bg-black/[0.02]"
            >
              <Avatar nombre={t.nombre} size={44} />
              <div className="min-w-0">
                <div className="font-display text-lg font-bold text-ink">
                  {t.nombre}
                </div>
                <div className="font-mono text-xs text-ink-muted">
                  {t.telefono}
                </div>
              </div>
              <span className="ml-auto text-sm font-medium text-ranko">
                Abrir →
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState>
          No hay técnicos activos. Cargá uno en Técnicos para poder simular.
        </EmptyState>
      )}
    </div>
  );
}
