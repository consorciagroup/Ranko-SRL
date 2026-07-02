import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { procesarMensaje } from "@/lib/bot/engine";
import type { MensajeEntrante } from "@/lib/bot/engine";
import { realDeps } from "@/lib/bot/deps";

// Webhook de la Meta WhatsApp Cloud API.
// GET: verificación inicial al configurar el webhook en el panel de Meta.
// POST: mensajes entrantes de los técnicos.

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  if (!firmaValida(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: MetaWebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const deps = realDeps();
  for (const mensaje of extraerMensajes(body)) {
    try {
      await procesarMensaje(mensaje, deps);
    } catch (err) {
      // Nunca devolvemos error a Meta por un fallo de procesamiento:
      // reintentaría el mismo payload y duplicaría respuestas al técnico.
      console.error("Error procesando mensaje de WhatsApp:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

function firmaValida(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  // Sin secreto configurado (dev local) no validamos firma
  if (!secret) return true;
  if (!header?.startsWith("sha256=")) return false;

  const esperada = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const recibida = header.slice("sha256=".length);
  return (
    esperada.length === recibida.length &&
    crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(recibida))
  );
}

// ---- Parseo del payload de Meta ----

interface MetaMessage {
  from: string;
  type: string;
  text?: { body: string };
  image?: { id: string };
  interactive?: {
    type: string;
    button_reply?: { id: string };
    list_reply?: { id: string };
  };
}

interface MetaWebhookBody {
  entry?: {
    changes?: {
      value?: { messages?: MetaMessage[] };
    }[];
  }[];
}

function extraerMensajes(body: MetaWebhookBody): MensajeEntrante[] {
  const mensajes: MensajeEntrante[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      // value.statuses (sent/delivered/read) se ignora: solo procesamos messages
      for (const m of change.value?.messages ?? []) {
        mensajes.push({
          telefono: m.from,
          texto: m.text?.body,
          interactiveId:
            m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id,
          imagenMediaId: m.image?.id,
        });
      }
    }
  }
  return mensajes;
}
