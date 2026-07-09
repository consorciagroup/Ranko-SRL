import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { procesarMensaje } from "@/lib/bot/engine";
import type { MensajeEntrante } from "@/lib/bot/engine";
import { realDeps } from "@/lib/bot/deps";

// Webhook de la Meta WhatsApp Cloud API.
// GET: verificación inicial al configurar el webhook en el panel de Meta.
// POST: mensajes entrantes de los técnicos.

// Runtime Node.js (default explícito): usamos node:crypto para validar la firma
// HMAC y hacemos I/O a Supabase + Graph API. El runtime edge no aplica acá.
export const runtime = "nodejs";
// Meta reintenta ante cualquier respuesta no-2xx. El POST puede encadenar varias
// llamadas (Supabase + envíos a la Graph API por cada mensaje del batch), así que
// damos margen sobre el default de Vercel para no cortar a mitad de procesamiento.
export const maxDuration = 30;

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
  // Dedupe por message id dentro del batch: Meta puede reenviar el mismo payload
  // (reintentos ante timeout) o incluir el mismo mensaje más de una vez.
  const vistos = new Set<string>();
  for (const mensaje of extraerMensajes(body)) {
    if (mensaje.id) {
      if (vistos.has(mensaje.id)) continue;
      vistos.add(mensaje.id);
    }
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

export function firmaValida(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  // Sin secreto configurado (dev local) no validamos firma.
  // En producción esto es un agujero de seguridad: avisamos por log.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "WHATSAPP_APP_SECRET no configurado: se está aceptando el webhook sin validar la firma."
      );
    }
    return true;
  }
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
  id: string;
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

export function extraerMensajes(body: MetaWebhookBody): MensajeEntrante[] {
  const mensajes: MensajeEntrante[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      // value.statuses (sent/delivered/read) se ignora: solo procesamos messages
      for (const m of change.value?.messages ?? []) {
        mensajes.push({
          id: m.id,
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
