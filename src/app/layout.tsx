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
          <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto bg-ranko-ink px-3 py-7 text-white">
            <div className="mb-8 flex justify-center">
              <Image
                src="/logo-ranko-oscuro.png"
                alt="Ranko SRL — Ingeniería contra incendios"
                width={220}
                height={57}
                priority
                className="h-auto w-[218px]"
              />
            </div>

            <SidebarNav />

            <div className="mt-auto -mx-3 flex items-center gap-3 border-t border-white/10 px-4 pt-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ranko text-sm font-semibold text-white">
                RS
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-base font-semibold text-white">Ranko SRL</span>
                <span className="text-sm text-white/60">Panel interno</span>
              </div>
            </div>
          </aside>

          <main className="flex flex-1 flex-col px-9 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
