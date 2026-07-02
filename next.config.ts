import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cabeceras de seguridad básicas para todas las rutas. Son baratas y no
  // interfieren con Supabase Realtime (WebSocket saliente del navegador hacia
  // Supabase) ni con el webhook de Meta. No fijamos CSP para no arriesgar
  // romper estilos/scripts inline de Next; se puede endurecer más adelante.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
