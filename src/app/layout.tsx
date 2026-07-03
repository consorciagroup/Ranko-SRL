import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        <div className="flex min-h-screen">
          <aside className="flex w-56 shrink-0 flex-col bg-ranko-ink text-white">
            <div className="border-b border-white/10 px-4 py-5">
              <div className="rounded-md bg-white px-3 py-2">
                <Image
                  src="/logo-ranko.png"
                  alt="Ranko SRL — Ingeniería contra incendios"
                  width={220}
                  height={57}
                  priority
                />
              </div>
              <div className="mt-2 px-1 text-xs text-neutral-300">
                Panel de logística
              </div>
            </div>
            <SidebarNav />
          </aside>
          <main className="flex-1 px-8 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
