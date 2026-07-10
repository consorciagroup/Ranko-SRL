"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Íconos inline (stroke, currentColor) — sin dependencia externa. Escalan con
// el texto vía em, así siguen la escala generosa del panel.
function baseIcon(props: IconProps, children: React.ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[1.25em] w-[1.25em] shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

const IconInicio = (p: IconProps) =>
  baseIcon(p, <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>);
const IconReportes = (p: IconProps) =>
  baseIcon(p, <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M10 13h6M10 17h6" /></>);
const IconCerrados = (p: IconProps) =>
  baseIcon(p, <><path d="M4 7h16v13H4z" /><path d="M4 7 6 3h12l2 4" /><path d="m9.5 13.5 2 2 3.5-3.5" /></>);
const IconRutas = (p: IconProps) =>
  baseIcon(p, <><path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6 3-6-3z" /><path d="M9 7v13M15 4v13" /></>);
// Matafuego de contorno (diseño propio, para combinar con los demás íconos de
// trazo): cuerpo cilíndrico, cuello, manija arriba y manguera curvando a la
// derecha con boquilla.
// Matafuego: el pictograma del sitio de Ranko (Font Awesome `fire-extinguisher`,
// solid), con la cornetita/manguera apuntando arriba-izquierda. Glifo relleno,
// por eso usa `fill` y su propio viewBox en vez de baseIcon (que es de trazo).
const IconTrabajos = (p: IconProps) => (
  <svg
    viewBox="0 0 448 512"
    fill="currentColor"
    aria-hidden="true"
    className="h-[1.25em] w-[1.25em] shrink-0"
    {...p}
  >
    <path d="M434.027 26.329l-168 28C254.693 56.218 256 67.8 256 72h-58.332C208.353 36.108 181.446 0 144 0c-39.435 0-66.368 39.676-52.228 76.203-52.039 13.051-75.381 54.213-90.049 90.884-4.923 12.307 1.063 26.274 13.37 31.197 12.317 4.926 26.279-1.075 31.196-13.37C75.058 112.99 106.964 120 168 120v27.076c-41.543 10.862-72 49.235-72 94.129V488c0 13.255 10.745 24 24 24h144c13.255 0 24-10.745 24-24V240c0-44.731-30.596-82.312-72-92.97V120h40c0 2.974-1.703 15.716 10.027 17.671l168 28C441.342 166.89 448 161.25 448 153.834V38.166c0-7.416-6.658-13.056-13.973-11.837zM144 72c-8.822 0-16-7.178-16-16s7.178-16 16-16 16 7.178 16 16-7.178 16-16 16z" />
  </svg>
);
const IconDirecciones = (p: IconProps) =>
  baseIcon(p, <><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>);
const IconTecnicos = (p: IconProps) =>
  baseIcon(p, <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 6a3 3 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></>);

// Todo a un mismo nivel, siempre visible en el sidebar.
const PRINCIPAL = [
  { href: "/", label: "Inicio", Icon: IconInicio },
  { href: "/reportes", label: "Reportes", Icon: IconReportes },
  { href: "/trabajos-cerrados", label: "Trabajos cerrados", Icon: IconCerrados, wrap: true },
  { href: "/rutas", label: "Rutas", Icon: IconRutas },
  { href: "/catalogo", label: "Trabajos", Icon: IconTrabajos },
  { href: "/direcciones", label: "Direcciones", Icon: IconDirecciones },
  { href: "/tecnicos", label: "Técnicos", Icon: IconTecnicos },
];

function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function itemClass(active: boolean) {
  return active
    ? "relative -mr-[18px] flex items-center gap-3 rounded-l-md bg-white/10 py-2.5 pl-2.5 pr-[28px] font-display text-base font-semibold tracking-wide text-white"
    : "relative flex items-center gap-3 rounded-md px-2.5 py-2.5 font-display text-base font-medium tracking-wide text-sidebar-muted hover:bg-white/10 hover:text-white";
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-3 flex flex-1 flex-col gap-1.5 px-1 pb-4">
      {PRINCIPAL.map(({ href, label, Icon, wrap }) => {
        const active = esActivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={itemClass(active)}
          >
            <Icon className={active ? "h-[1.25em] w-[1.25em] shrink-0 text-ranko" : "h-[1.25em] w-[1.25em] shrink-0 text-sidebar-muted"} />
            <span className={wrap ? "max-w-[6.5rem] leading-tight" : undefined}>{label}</span>
            {active && (
              <span
                aria-hidden
                className="absolute right-0 top-0 bottom-0 w-1.5 bg-ranko"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
