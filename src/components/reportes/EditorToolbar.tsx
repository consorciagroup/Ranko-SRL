"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";

// Botón individual de la toolbar. Refleja estado activo con fondo resaltado.
function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30 ${
        active
          ? "bg-ranko/[0.12] text-ranko"
          : "text-ink-2 hover:bg-black/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-hairline" />;
}

// Toolbar sticky del editor de reportes. Opera sobre el editor Tiptap
// actualmente enfocado (`editor`). Los botones se deshabilitan cuando la
// extensión correspondiente no está cargada en ese editor (ej: el editor de
// título no tiene encabezados, listas, cita ni alineación).
export function EditorToolbar({ editor }: { editor: Editor | null }) {
  const iconClass = "h-4 w-4";

  // ¿El editor activo tiene cargada esta extensión? Evita invocar comandos
  // inexistentes (que tirarían error) sobre el editor de título.
  const has = (name: string) =>
    !!editor?.extensionManager.extensions.some((e) => e.name === name);

  return (
    <div className="no-print sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center gap-0.5 border-b border-hairline bg-surface px-1 py-2">
      <ToolBtn
        title="Negrita"
        disabled={!editor}
        active={editor?.isActive("bold")}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Cursiva"
        disabled={!editor}
        active={editor?.isActive("italic")}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Subrayado"
        disabled={!editor}
        active={editor?.isActive("underline")}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <Underline className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Tachado"
        disabled={!editor}
        active={editor?.isActive("strike")}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className={iconClass} />
      </ToolBtn>

      <Sep />

      <ToolBtn
        title="Título 1"
        disabled={!has("heading")}
        active={editor?.isActive("heading", { level: 1 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Título 2"
        disabled={!has("heading")}
        active={editor?.isActive("heading", { level: 2 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Título 3"
        disabled={!has("heading")}
        active={editor?.isActive("heading", { level: 3 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className={iconClass} />
      </ToolBtn>

      <Sep />

      <ToolBtn
        title="Lista con viñetas"
        disabled={!has("bulletList")}
        active={editor?.isActive("bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Lista numerada"
        disabled={!has("orderedList")}
        active={editor?.isActive("orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Cita"
        disabled={!has("blockquote")}
        active={editor?.isActive("blockquote")}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote className={iconClass} />
      </ToolBtn>

      <Sep />

      <ToolBtn
        title="Alinear a la izquierda"
        disabled={!has("textAlign")}
        active={editor?.isActive({ textAlign: "left" })}
        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Centrar"
        disabled={!has("textAlign")}
        active={editor?.isActive({ textAlign: "center" })}
        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Alinear a la derecha"
        disabled={!has("textAlign")}
        active={editor?.isActive({ textAlign: "right" })}
        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className={iconClass} />
      </ToolBtn>

      <Sep />

      <ToolBtn
        title="Enlace"
        disabled={!has("link")}
        active={editor?.isActive("link")}
        onClick={() => {
          if (!editor) return;
          const previa = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("URL del enlace:", previa ?? "");
          if (url === null) return; // cancelado
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }}
      >
        <LinkIcon className={iconClass} />
      </ToolBtn>

      <Sep />

      <ToolBtn
        title="Deshacer"
        disabled={!editor}
        onClick={() => editor?.chain().focus().undo().run()}
      >
        <Undo className={iconClass} />
      </ToolBtn>
      <ToolBtn
        title="Rehacer"
        disabled={!editor}
        onClick={() => editor?.chain().focus().redo().run()}
      >
        <Redo className={iconClass} />
      </ToolBtn>
    </div>
  );
}
