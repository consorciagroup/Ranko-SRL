// Wrapper mínimo de la Meta WhatsApp Cloud API (oficial).
// Funciona igual con el número de prueba (dev/demo) y el número productivo de
// Ranko: solo cambian WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN.

const GRAPH_VERSION = "v23.0";

function graphUrl(path: string) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;
}

function accessToken(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta WHATSAPP_ACCESS_TOKEN (ver .env.example)");
  return token;
}

function phoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("Falta WHATSAPP_PHONE_NUMBER_ID (ver .env.example)");
  return id;
}

async function sendMessage(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(graphUrl(`${phoneNumberId()}/messages`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      ...payload,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WhatsApp API ${res.status}: ${body}`);
  }
}

export async function sendText(to: string, body: string): Promise<void> {
  await sendMessage({ to, type: "text", text: { body } });
}

export interface Boton {
  id: string;
  // Máximo 20 caracteres (límite de la API)
  title: string;
}

export async function sendButtons(
  to: string,
  body: string,
  buttons: Boton[]
): Promise<void> {
  // La API admite hasta 3 botones por mensaje
  await sendMessage({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: truncate(b.title, 20) },
        })),
      },
    },
  });
}

export interface FilaLista {
  id: string;
  // Máximo 24 caracteres
  title: string;
  // Máximo 72 caracteres
  description?: string;
}

export async function sendList(
  to: string,
  opts: {
    body: string;
    buttonText: string;
    sections: { title: string; rows: FilaLista[] }[];
  }
): Promise<void> {
  // La API admite hasta 10 filas en total entre todas las secciones
  await sendMessage({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: opts.body },
      action: {
        button: truncate(opts.buttonText, 20),
        sections: opts.sections.map((s) => ({
          title: truncate(s.title, 24),
          rows: s.rows.map((r) => ({
            id: r.id,
            title: truncate(r.title, 24),
            description: r.description ? truncate(r.description, 72) : undefined,
          })),
        })),
      },
    },
  });
}

// Descarga un media (foto/video) recibido por webhook: primero se pide la URL
// firmada del media id, después se descarga con el mismo token.
export async function downloadMedia(
  mediaId: string
): Promise<{ data: ArrayBuffer; mimeType: string }> {
  const metaRes = await fetch(graphUrl(mediaId), {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!metaRes.ok) {
    throw new Error(`WhatsApp media meta ${metaRes.status}: ${await metaRes.text()}`);
  }
  const meta = (await metaRes.json()) as { url: string; mime_type: string };

  const fileRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!fileRes.ok) {
    throw new Error(`WhatsApp media download ${fileRes.status}`);
  }
  return { data: await fileRes.arrayBuffer(), mimeType: meta.mime_type };
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
