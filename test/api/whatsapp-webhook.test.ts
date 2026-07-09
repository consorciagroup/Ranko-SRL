import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { firmaValida, extraerMensajes } from "@/app/api/whatsapp/webhook/route";

function firmar(raw: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

describe("firmaValida", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("acepta una firma HMAC-SHA256 correcta", () => {
    const secret = "un-secreto-de-prueba";
    vi.stubEnv("WHATSAPP_APP_SECRET", secret);
    const raw = '{"hola":"mundo"}';
    expect(firmaValida(raw, firmar(raw, secret))).toBe(true);
  });

  it("rechaza una firma que no corresponde al payload", () => {
    const secret = "un-secreto-de-prueba";
    vi.stubEnv("WHATSAPP_APP_SECRET", secret);
    const raw = '{"hola":"mundo"}';
    const firmaDeOtroPayload = firmar('{"otro":"payload"}', secret);
    expect(firmaValida(raw, firmaDeOtroPayload)).toBe(false);
  });

  it("rechaza un header sin el prefijo sha256=", () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "un-secreto-de-prueba");
    expect(firmaValida("{}", "abc123")).toBe(false);
  });

  it("rechaza cuando el header es null", () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "un-secreto-de-prueba");
    expect(firmaValida("{}", null)).toBe(false);
  });

  it("acepta sin validar cuando no hay secret configurado (dev local)", () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "");
    expect(firmaValida("{}", null)).toBe(true);
  });
});

describe("extraerMensajes", () => {
  it("parsea un mensaje de texto", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { id: "wamid.1", from: "549110001", type: "text", text: { body: "hola" } },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(extraerMensajes(body)).toEqual([
      { id: "wamid.1", telefono: "549110001", texto: "hola", interactiveId: undefined, imagenMediaId: undefined },
    ]);
  });

  it("parsea un mensaje de imagen tomando el media id", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { id: "wamid.2", from: "549110002", type: "image", image: { id: "media-99" } },
                ],
              },
            },
          ],
        },
      ],
    };
    const [m] = extraerMensajes(body);
    expect(m.imagenMediaId).toBe("media-99");
    expect(m.texto).toBeUndefined();
  });

  it("parsea un botón interactivo (button_reply)", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.3",
                    from: "549110003",
                    type: "interactive",
                    interactive: { type: "button_reply", button_reply: { id: "resp:si" } },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(extraerMensajes(body)[0].interactiveId).toBe("resp:si");
  });

  it("parsea una respuesta de lista (list_reply)", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.4",
                    from: "549110004",
                    type: "interactive",
                    interactive: { type: "list_reply", list_reply: { id: "parada:dir-1" } },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(extraerMensajes(body)[0].interactiveId).toBe("parada:dir-1");
  });

  it("conserva mensajes sin id (id undefined)", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { from: "549110005", type: "text", text: { body: "sin id" } },
                ],
              },
            },
          ],
        },
      ],
    } as Parameters<typeof extraerMensajes>[0];
    const [m] = extraerMensajes(body);
    expect(m.id).toBeUndefined();
    expect(m.texto).toBe("sin id");
  });

  it("devuelve array vacío con entry ausente", () => {
    expect(extraerMensajes({})).toEqual([]);
  });

  it("devuelve array vacío con changes/messages ausentes o vacíos", () => {
    expect(extraerMensajes({ entry: [{}] })).toEqual([]);
    expect(extraerMensajes({ entry: [{ changes: [{}] }] })).toEqual([]);
    expect(extraerMensajes({ entry: [{ changes: [{ value: { messages: [] } }] }] })).toEqual([]);
  });
});
