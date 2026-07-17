import { describe, expect, it } from "vitest";
import {
  esHtml,
  textoPlanoAHtml,
  contenidoAHtml,
  stripHtml,
  esContenidoVacio,
  sanitizarContenido,
} from "@/lib/richtext";

describe("textoPlanoAHtml", () => {
  it("envuelve el texto en un <p> y convierte cada \\n en <br>", () => {
    expect(textoPlanoAHtml("linea 1\nlinea 2")).toBe(
      "<p>linea 1<br>linea 2</p>",
    );
  });

  it("escapa las entidades HTML peligrosas", () => {
    expect(textoPlanoAHtml("a & b <tag>")).toBe(
      "<p>a &amp; b &lt;tag&gt;</p>",
    );
  });
});

describe("contenidoAHtml", () => {
  it("devuelve '' para null o vacío", () => {
    expect(contenidoAHtml(null)).toBe("");
    expect(contenidoAHtml("")).toBe("");
  });

  it("convierte texto legacy con saltos de línea a <p> con <br>", () => {
    expect(contenidoAHtml("hola\nchau")).toBe("<p>hola<br>chau</p>");
  });

  it("no reenvuelve contenido que ya es HTML (idempotente)", () => {
    const html = "<p>ya <strong>formateado</strong></p>";
    expect(contenidoAHtml(html)).toBe(html);
    // Idempotencia: aplicarlo dos veces no cambia el resultado.
    expect(contenidoAHtml(contenidoAHtml(html))).toBe(html);
  });
});

describe("esHtml", () => {
  it("detecta un tag HTML", () => {
    expect(esHtml("<p>hola</p>")).toBe(true);
  });

  it("no confunde texto plano con HTML", () => {
    expect(esHtml("hola, todo bien")).toBe(false);
  });
});

describe("stripHtml", () => {
  it("quita los tags y des-escapa entidades básicas", () => {
    expect(stripHtml("<p>a &amp; b</p>")).toBe("a & b");
  });
});

describe("esContenidoVacio", () => {
  it("considera vacío el <p></p> que emite un editor sin texto", () => {
    expect(esContenidoVacio("<p></p>")).toBe(true);
  });

  it("no considera vacío un párrafo con texto", () => {
    expect(esContenidoVacio("<p>hola</p>")).toBe(false);
  });
});

describe("sanitizarContenido", () => {
  it("pela un <script> malicioso", () => {
    const salida = sanitizarContenido("<p>hola</p><script>alert(1)</script>");
    expect(salida).not.toContain("script");
    expect(salida).toContain("<p>hola</p>");
  });

  it("conserva el text-align de TextAlign en un <p>", () => {
    const salida = sanitizarContenido('<p style="text-align: right">hola</p>');
    expect(salida).toContain("text-align");
    expect(salida).toContain("right");
  });

  it("agrega target y rel a los links", () => {
    const salida = sanitizarContenido('<a href="https://ranko.com">link</a>');
    expect(salida).toContain('target="_blank"');
    expect(salida).toContain("noopener");
  });
});
