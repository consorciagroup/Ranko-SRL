// Avatar — círculo de color sólido con iniciales. El color se deriva de forma
// determinística del nombre, así la misma persona tiene siempre el mismo color
// en todo el panel (no hay carga de fotos en v1).
const PALETTE = [
  "bg-ranko",
  "bg-estado-encurso",
  "bg-estado-completada",
  "bg-estado-revision",
  "bg-estado-observacion",
];

function colorDe(nombre: string): string {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    // Ignora símbolos/paréntesis (ej: "Facundo (test)" → "FT", no "F(").
    .map((p) => p.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ nombre, size = 32 }: { nombre: string; size?: number }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorDe(
        nombre || "?"
      )}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {iniciales(nombre || "?")}
    </div>
  );
}
