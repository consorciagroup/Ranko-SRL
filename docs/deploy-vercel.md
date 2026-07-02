# Deploy a Vercel — checklist

Panel Next.js 16 (App Router) + Supabase. Vercel autodetecta Next.js: no hace
falta `vercel.json` ni `buildCommand` manual.

## 1. Variables de entorno (Project Settings → Environment Variables)

Cargar en Vercel (Production y Preview). Los valores reales están en el gestor de
contraseñas / `.env.local` local, no en el repo.

| Variable | Ámbito | Notas |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente | Expuesta al navegador (Realtime + reads). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente | Publishable key; segura de exponer. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | **Secreto.** Nunca con prefijo `NEXT_PUBLIC`. Bypassa RLS. |
| `WHATSAPP_PHONE_NUMBER_ID` | Server | ID del número (Meta → WhatsApp → API Setup). |
| `WHATSAPP_ACCESS_TOKEN` | Server | Usar token de sistema **permanente** en prod (no el de 24 h de dev). |
| `WHATSAPP_VERIFY_TOKEN` | Server | String que elegimos nosotros; debe coincidir con el del panel de Meta. |
| `WHATSAPP_APP_SECRET` | Server | **Secreto.** Valida la firma `x-hub-signature-256`. Obligatorio en prod. |

Gotcha: sin `WHATSAPP_APP_SECRET` en producción el webhook acepta POSTs sin
validar firma (solo loguea un warning). Cargarla siempre en prod.

## 2. Webhook de Meta apuntando a producción

1. Deploy a Vercel y obtener el dominio de producción (ej. `https://<proyecto>.vercel.app`
   o el dominio custom).
2. Meta for Developers → app de Ranko → WhatsApp → Configuration → Webhook.
3. Callback URL: `https://<dominio>/api/whatsapp/webhook`
4. Verify token: el mismo valor que `WHATSAPP_VERIFY_TOKEN`.
   Meta hace un `GET` de verificación (`hub.challenge`); debe responder 200.
5. Suscribir el campo `messages`.
6. Probar enviando un mensaje al número; verificar logs de la función en Vercel.

El route handler `/api/whatsapp/webhook` corre en runtime Node.js con
`maxDuration = 30`. Devuelve 200 aun ante fallos de procesamiento (a propósito):
un no-2xx haría que Meta reintente el mismo payload y duplique respuestas.

## 3. Gotchas

- **Service role**: `SUPABASE_SERVICE_ROLE_KEY` solo se usa en server components
  y route handlers (`src/lib/supabase/server.ts`, marcado `server-only`). No debe
  filtrarse al bundle del cliente.
- **Realtime**: el cliente (`DashboardLive`) abre un WebSocket a Supabase con la
  anon key. Requiere que Realtime esté habilitado en las tablas del proyecto
  Supabase. No depende de config de Vercel.
- **Páginas dinámicas**: todas las páginas son `force-dynamic` (leen Supabase por
  request con service role). No se cachean ni prerenderean; es intencional.
- **Región**: el proyecto Supabase está en `sa-east-1` (São Paulo). Si la latencia
  server→DB molesta, se puede fijar la región de Vercel más cercana; hoy no se
  configura (Vercel usa `iad1` por defecto). No agregar `vercel.json` solo por esto
  sin medir antes.
