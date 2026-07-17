// Helpers puros para el contenido narrativo rico de los reportes (título,
// resumen, cierre). El editor (Tiptap) produce HTML; la base guarda ese HTML
// como texto. Los reportes viejos guardaron texto plano — `contenidoAHtml` los
// migra al vuelo sin tocar el schema.

import sanitizeHtml from "sanitize-html";

// Heurística: ¿el texto ya viene con al menos un tag HTML? Alcanza para
// distinguir el HTML del editor del texto plano legacy.
export function esHtml(texto: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(texto);
}

// Convierte texto plano en un párrafo HTML: escapa las entidades peligrosas y
// preserva los saltos de línea como <br>.
export function textoPlanoAHtml(texto: string): string {
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<p>${escapado}</p>`;
}

// Punto único de entrada para renderizar/precargar contenido narrativo:
// - vacío/null → "" (nada que mostrar)
// - ya-HTML → tal cual (idempotente, no se reenvuelve)
// - texto plano legacy → párrafo HTML con <br>
export function contenidoAHtml(texto: string | null): string {
  if (!texto) return "";
  if (esHtml(texto)) return texto;
  return textoPlanoAHtml(texto);
}

// Quita los tags y des-escapa las entidades básicas, para mostrar el contenido
// como texto plano en listados. `&amp;` se resuelve último para no re-des-escapar.
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

// Un editor Tiptap "vacío" devuelve "<p></p>", no "". Se decide por el texto
// visible, no por el markup.
export function esContenidoVacio(html: string): boolean {
  return stripHtml(html) === "";
}

// Sanitiza el HTML del editor antes de persistirlo. Corre en Node puro (sin
// DOM), por eso se usa dentro de la Server Action. La whitelist cubre justo lo
// que emite la toolbar (incluyendo `style="text-align: ..."` de TextAlign).
export function sanitizarContenido(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|center|right|justify)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      }),
    },
  });
}
