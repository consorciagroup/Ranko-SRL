import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/rutas", label: "Rutas" },
  { href: "/catalogo", label: "Tipos de trabajo" },
  { href: "/direcciones", label: "Direcciones" },
  { href: "/tecnicos", label: "Técnicos" },
];

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
          <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white">
            <div className="px-5 py-6">
              <div className="text-lg font-bold tracking-tight">Ranko</div>
              <div className="text-xs text-neutral-500">Panel de logística</div>
            </div>
            <nav className="flex flex-col gap-1 px-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 px-8 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
