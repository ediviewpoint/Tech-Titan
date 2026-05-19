/**
 * Resuelve el src de imagen de un producto.
 *
 * - Si svg_key comienza con http/https → URL externa (imagen web)
 * - Si svg_key es un string simple     → SVG local en /hardware/{key}.svg
 * - Si svg_key es null/undefined       → null (mostrar ícono fallback)
 */
export function resolveProductImage(svgKey: string | null | undefined): string | null {
  if (!svgKey?.trim()) return null;
  if (svgKey.startsWith("http://") || svgKey.startsWith("https://")) {
    return svgKey;
  }
  return `/hardware/${svgKey}.svg`;
}

export function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}
