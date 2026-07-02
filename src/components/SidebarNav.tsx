"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/rutas", label: "Rutas" },
  { href: "/catalogo", label: "Tipos de trabajo" },
  { href: "/direcciones", label: "Direcciones" },
  { href: "/tecnicos", label: "Técnicos" },
];

// Nav del sidebar con indicador de página activa. El acento rojo de marca
// (border-l) marca dónde está parado el usuario de logística sin saturar.
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-3 flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-md border-l-2 border-ranko bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                : "rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
