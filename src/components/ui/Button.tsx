import type { ComponentProps } from "react";

// Botón unificado del panel. Concentra variantes, foco visible (accesibilidad)
// y estado disabled en un solo lugar, en vez de repetir clases en cada form.
const VARIANTS = {
  primary: "bg-ranko text-white hover:bg-ranko-dark",
  secondary: "border border-neutral-300 text-neutral-700 hover:bg-neutral-100",
  success: "bg-green-700 text-white hover:bg-green-600",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-lg px-5 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ranko/40 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
