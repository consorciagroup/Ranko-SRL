import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { leerBandeja } from "@/lib/sim/bandeja";
import type { Tecnico } from "@/lib/types";
import { SimuladorChat } from "../SimuladorChat";

export const dynamic = "force-dynamic";

// Pantalla de un técnico: su "WhatsApp" simulado. Lee el hilo inicial y lo
// pasa al chat, que después lo mantiene al día por polling.
export default async function SimuladorTecnicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabaseAdmin()
    .from("tecnicos")
    .select("*")
    .eq("id", id)
    .eq("activo", true)
    .maybeSingle();
  const tecnico = data as Tecnico | null;
  if (!tecnico) notFound();

  const bandejaInicial = await leerBandeja(tecnico.id);

  return (
    <div className="mx-auto max-w-[720px]">
      <Link
        href="/simulador"
        className="text-sm text-ink-muted hover:text-ink hover:underline"
      >
        ← Todos los técnicos
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <Avatar nombre={tecnico.nombre} size={44} />
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {tecnico.nombre}
          </h1>
          <div className="font-mono text-xs text-ink-muted">
            {tecnico.telefono}
          </div>
        </div>
      </div>

      <SimuladorChat
        tecnico={{
          id: tecnico.id,
          nombre: tecnico.nombre,
          telefono: tecnico.telefono,
        }}
        bandejaInicial={bandejaInicial}
      />
    </div>
  );
}
