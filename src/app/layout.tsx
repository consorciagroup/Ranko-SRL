import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import Image from "next/image";
import { SidebarNav } from "@/components/SidebarNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Archivo — fuente display para títulos y encabezados de sección (adición
// intencional del design system, no está en el repo original que usa solo Geist).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Ranko — Reportes",
  description: "Sistema de reportes de inspección y mantenimiento — Ranko SRL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto bg-ranko-ink px-5 py-7 text-white">
            <div className="mb-6 flex flex-col gap-2">
              <div className="inline-flex self-start rounded-md bg-white px-3 py-2">
                <Image
                  src="/logo-ranko.png"
                  alt="Ranko SRL — Ingeniería contra incendios"
                  width={220}
                  height={57}
                  priority
                />
              </div>
            </div>

            <SidebarNav />

            <div className="mt-auto flex items-center gap-2.5 rounded-md bg-surface p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ranko text-xs font-semibold text-white">
                RS
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-ink-2">Ranko SRL</span>
                <span className="text-xs text-ink-muted">Panel interno</span>
              </div>
            </div>
          </aside>

          <main className="flex flex-1 flex-col px-9 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
