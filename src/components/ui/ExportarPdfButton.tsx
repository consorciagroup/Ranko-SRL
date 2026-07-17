"use client";

// Exporta el reporte a PDF vía el diálogo de impresión del navegador (el CSS
// `@media print` en globals.css oculta el chrome y ajusta la hoja). Sin
// dependencias de generación server-side de PDF. `no-print` lo esconde del
// propio PDF resultante.
export function ExportarPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print text-sm font-medium text-ink-muted hover:text-ink"
    >
      Exportar a PDF
    </button>
  );
}
