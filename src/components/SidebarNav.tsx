"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Todo a un mismo nivel, siempre visible en el sidebar.
const PRINCIPAL = [
  { href: "/", label: "Dashboard" },
  { href: "/rutas", label: "Rutas" },
  { href: "/catalogo", label: "Trabajos" },
  { href: "/direcciones", label: "Direcciones" },
  { href: "/tecnicos", label: "Técnicos" },
];

function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Fila de nav: punto de 6px + label. Activo → punto rojo de marca + tinte rojo
// + texto blanco; inactivo → gris apagado que se aclara levemente en hover.
function itemClass(active: boolean) {
  return active
    ? "flex items-center gap-2.5 rounded-md bg-ranko/[0.14] px-3 py-2 text-sm font-medium text-white"
    : "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted hover:bg-white/[0.06] hover:text-white";
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {PRINCIPAL.map((item) => {
        const active = esActivo(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={itemClass(active)}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                active ? "bg-ranko" : "bg-sidebar-muted"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
