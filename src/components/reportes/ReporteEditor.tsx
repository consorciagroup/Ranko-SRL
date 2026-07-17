"use client";

import { useReducer, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { ESTADO_REPORTE_LABEL } from "@/lib/types";
import type { Reporte, Direccion, VisitaItem } from "@/lib/types";
import { formatFecha } from "@/lib/format";
import { contenidoAHtml } from "@/lib/richtext";
import { TrabajosList, type VisitaFull } from "./TrabajosList";
import { EditorToolbar } from "./EditorToolbar";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { actualizarReporte } from "@/app/reportes/actions";

type Fila = { visita_id: string; orden: number; visitas: VisitaFull };

// Editor de reportes: replica visualmente la "hoja" de la vista final, pero con
// el contenido narrativo (título, resumen, cierre) reemplazado por editores
// Tiptap ricos. Una única toolbar sticky opera sobre el editor enfocado. Al
// guardar, el HTML de cada campo viaja a la Server Action `actualizarReporte`.
export function ReporteEditor({
  reporte,
  direccion,
  filas,
  itemsPorVisita,
  rango,
  totalObs,
  tecnicos,
}: {
  reporte: Reporte;
  direccion: Direccion;
  filas: Fila[];
  itemsPorVisita: Map<string, VisitaItem[]>;
  rango: string;
  totalObs: number;
  tecnicos: string[];
}) {
  // Editor actualmente enfocado (sobre el que opera la toolbar). Se setea en
  // focus y NO se limpia en blur, para que la toolbar siga apuntando al último
  // editor tocado incluso al hacer click en un botón.
  const [activo, setActivo] = useState<Editor | null>(null);
  // Fuerza re-render de la toolbar en cada transacción para reflejar el estado
  // de formato (activo/inactivo) al mover el cursor o tipear.
  const [, force] = useReducer((x) => x + 1, 0);

  const [tituloHtml, setTituloHtml] = useState(contenidoAHtml(reporte.titulo));
  const [resumenHtml, setResumenHtml] = useState(
    contenidoAHtml(reporte.resumen),
  );
  const [cierreHtml, setCierreHtml] = useState(contenidoAHtml(reporte.cierre));

  const editorTitulo = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
      }),
    ],
    content: contenidoAHtml(reporte.titulo),
    // El título es una sola línea: Enter no debe crear un párrafo nuevo.
    editorProps: {
      handleKeyDown: (_view, event) => event.key === "Enter",
    },
    onUpdate: ({ editor }) => setTituloHtml(editor.getHTML()),
    onFocus: ({ editor }) => setActivo(editor),
    onTransaction: () => force(),
  });

  const editorResumen = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: contenidoAHtml(reporte.resumen),
    onUpdate: ({ editor }) => setResumenHtml(editor.getHTML()),
    onFocus: ({ editor }) => setActivo(editor),
    onTransaction: () => force(),
  });

  const editorCierre = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: contenidoAHtml(reporte.cierre),
    onUpdate: ({ editor }) => setCierreHtml(editor.getHTML()),
    onFocus: ({ editor }) => setActivo(editor),
    onTransaction: () => force(),
  });

  return (
    <form action={actualizarReporte}>
      <input type="hidden" name="id" value={reporte.id} />
      <input type="hidden" name="titulo" value={tituloHtml} />
      <input type="hidden" name="resumen" value={resumenHtml} />
      <input type="hidden" name="cierre" value={cierreHtml} />

      {/* Barra superior: volver + toolbar sticky */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          href={`/reportes/${reporte.id}`}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Volver al reporte
        </Link>
        <span className="text-sm text-ink-muted">Editando reporte</span>
      </div>

      <EditorToolbar editor={activo} />

      {/* La hoja del informe (misma estructura que la vista final) */}
      <article className="overflow-hidden rounded-2xl bg-surface hairline">
        <div className="h-1.5 w-full bg-ranko" />

        <div className="p-8 sm:p-10">
          {/* Membrete */}
          <header className="flex items-start justify-between gap-6">
            <Image
              src="/logo-ranko.png"
              alt="Ranko SRL"
              width={180}
              height={47}
              priority
            />
            <div className="text-right text-sm">
              <div className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
                Informe
              </div>
              <div className="mt-1">
                <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-2 hairline">
                  {ESTADO_REPORTE_LABEL[reporte.estado]}
                </span>
              </div>
              <div className="mt-2 text-xs text-ink-muted">
                Emitido {formatFecha(reporte.created_at.slice(0, 10))}
              </div>
            </div>
          </header>

          <div className="my-7 h-px w-full bg-hairline" />

          {/* Portada — título editable */}
          <EditorContent
            editor={editorTitulo}
            className="reporte-rico -mx-2 rounded-md px-2 font-display text-4xl font-bold leading-tight tracking-tight text-ink focus-within:bg-ranko/[0.04]"
          />
          <div className="mt-3 text-lg font-semibold text-ink-2">
            {direccion.direccion}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <span>{direccion.cliente}</span>
            <span aria-hidden>·</span>
            <span>{rango}</span>
          </div>

          {/* Meta chips */}
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-canvas px-3 py-1.5 font-medium text-ink-2 hairline">
              {filas.length} trabajo{filas.length !== 1 && "s"}
            </span>
            {totalObs > 0 && (
              <span className="rounded-full bg-canvas px-3 py-1.5 font-medium text-ink-2 hairline">
                {totalObs} observación{totalObs !== 1 && "es"}
              </span>
            )}
            {tecnicos.length > 0 && (
              <span className="rounded-full bg-canvas px-3 py-1.5 font-medium text-ink-2 hairline">
                {tecnicos.join(" · ")}
              </span>
            )}
          </div>

          {/* Resumen — editable */}
          <section className="mt-8">
            <SectionLabel>Resumen</SectionLabel>
            <EditorContent
              editor={editorResumen}
              className="reporte-rico -mx-2 mt-2 rounded-md px-2 leading-relaxed text-ink-2 focus-within:bg-ranko/[0.04]"
            />
          </section>

          {/* Trabajos (solo lectura, no se edita desde acá) */}
          <TrabajosList filas={filas} itemsPorVisita={itemsPorVisita} />

          {/* Cierre — editable */}
          <section className="mt-8">
            <SectionLabel>Cierre</SectionLabel>
            <EditorContent
              editor={editorCierre}
              className="reporte-rico -mx-2 mt-2 rounded-md px-2 leading-relaxed text-ink-2 focus-within:bg-ranko/[0.04]"
            />
          </section>

          {/* Pie */}
          <footer className="mt-10 border-t border-hairline pt-4 text-xs text-ink-muted">
            Ranko SRL · Ingeniería contra incendios · rankosrl.com.ar
          </footer>
        </div>
      </article>

      {/* Acciones */}
      <div className="no-print mt-6 flex items-center justify-end gap-3">
        <Link href={`/reportes/${reporte.id}`}>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
        <SubmitButton pendingText="Guardando…">Guardar</SubmitButton>
      </div>
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ranko">
      {children}
    </h2>
  );
}
