"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Todo a un mismo nivel, siempre visible en el sidebar.
const PRINCIPAL = [
  { href: "/", label: "Dashboard" },
  { href: "/reportes", label: "Reportes" },
  { href: "/rutas", label: "Rutas" },
  { href: "/catalogo", label: "Trabajos" },
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
    </nav>
  );
}
