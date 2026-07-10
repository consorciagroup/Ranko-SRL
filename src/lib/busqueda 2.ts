// Normaliza texto para búsquedas: pasa a minúsculas y saca acentos/diacríticos.
// `normalize("NFD")` separa la letra base de su tilde y `\p{Diacritic}` (flag u)
// elimina esas marcas combinantes. Así "Galería" matchea "galeria" y "Múgica"
// matchea "mugica". Se aplica tanto al término buscado como a cada campo.
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
