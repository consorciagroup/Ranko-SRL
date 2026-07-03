"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Operativo diario: bien a mano, arriba.
const PRINCIPAL = [
  { href: "/", label: "Dashboard" },
  { href: "/rutas", label: "Rutas" },
];

// Configuración (datos maestros): se usan poco. Colapsados detrás de "Configuración",
// a propósito "menos a mano", para evitar cambios accidentales.
const CONFIG = [
  { href: "/catalogo", label: "Tipos de trabajo" },
  { href: "/direcciones", label: "Direcciones" },
  { href: "/tecnicos", label: "Técnicos" },
];

function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function itemClass(active: boolean) {
  return active
    ? "block rounded-md border-l-2 border-ranko bg-white/10 px-3 py-2 text-sm font-semibold text-white"
    : "block rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white";
}

// Sub-ítem indentado dentro del grupo Configuración.
function subItemClass(active: boolean) {
  return active
    ? "block rounded-md border-l-2 border-ranko bg-white/10 py-2 pl-9 pr-3 text-sm font-semibold text-white"
    : "block rounded-md border-l-2 border-transparent py-2 pl-9 pr-3 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white";
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-3 flex flex-1 flex-col gap-1 px-3 pb-4">
      {PRINCIPAL.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={esActivo(pathname, item.href) ? "page" : undefined}
          className={itemClass(esActivo(pathname, item.href))}
        >
          {item.label}
        </Link>
      ))}

      {/* Configuración fijada al pie del sidebar; se despliega hacia arriba. */}
      <ConfigSection pathname={pathname} />
    </nav>
  );
}

// Grupo colapsable: "Configuración" despliega los 3 ítems debajo. Tocar de nuevo
// colapsa. Si estás parado en una sección de config, arranca desplegado.
function ConfigSection({ pathname }: { pathname: string }) {
  const enConfig = CONFIG.some((i) => esActivo(pathname, i.href));
  const [abierto, setAbierto] = useState(enConfig);

  // Escape para colapsar.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    // mt-auto empuja el grupo al pie; los sub-ítems se renderizan ANTES del
    // botón, así aparecen por encima y el despliegue crece hacia arriba.
    <div className="mt-auto flex flex-col gap-1">
      {abierto && (
        <div className="flex flex-col gap-1">
          {CONFIG.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={esActivo(pathname, item.href) ? "page" : undefined}
              className={subItemClass(esActivo(pathname, item.href))}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`flex w-full items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
          enConfig || abierto
            ? "border-ranko bg-white/10 font-semibold text-white"
            : "border-transparent font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Ruedita />
        <span>Configuración</span>
        {/* Chevron hacia arriba (colapsado, indica que abre hacia arriba);
            rota a apuntar abajo cuando está abierto. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`ml-auto h-4 w-4 transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

function Ruedita() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
