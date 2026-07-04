import type { ComponentProps } from "react";

// Botón unificado del panel. Concentra variantes, foco visible (accesibilidad)
// y estado disabled en un solo lugar, en vez de repetir clases en cada form.
// Variantes del design system: primary (fill rojo de marca), secondary (ghost
// + hairline, para acciones tipo "Ver"/"Cancelar"), success (verde, "Enviar por
// WhatsApp") y danger (ghost rojo para acciones destructivas: "Eliminar"/"Quitar").
const VARIANTS = {
  primary: "bg-ranko text-white hover:bg-ranko-dark",
  secondary: "hairline text-ink-muted hover:bg-black/[0.04]",
  success: "bg-estado-completada text-white hover:bg-green-600",
  danger: "hairline text-ranko hover:bg-ranko/[0.08]",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-lg px-5 py-2.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ranko/40 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
