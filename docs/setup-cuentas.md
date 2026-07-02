# Setup de cuentas — Ranko SRL

Todas las cuentas se crean **nuevas, a nombre de Ranko** (email dedicado, ej:
`sistemas@ranko...`), para poder entregárselas al cliente al final del proyecto.
Nada de infraestructura debe quedar en cuentas personales.

## 1. Supabase

1. Crear cuenta en [supabase.com](https://supabase.com) con el email de Ranko.
2. Crear un proyecto (plan Free alcanza para el MVP; región `sa-east-1` / São Paulo, la más cercana a Buenos Aires).
3. Vincular el repo local y aplicar las migraciones:
   ```bash
   supabase login                  # con la cuenta nueva
   supabase link --project-ref <ref-del-proyecto>
   supabase db push                # aplica supabase/migrations/
   ```
4. (Opcional, para la demo) Cargar los datos de ejemplo: correr el contenido de
   `supabase/seed.sql` desde el SQL Editor del dashboard de Supabase.
5. Copiar a `.env.local` (ver `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL` — Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable/anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — service role (secreta, solo server)

> Alternativa para desarrollar sin cuenta: instalar Docker Desktop y correr
> `supabase start` (stack local completo con las mismas migraciones).

## 2. Meta / WhatsApp Cloud API

1. Crear cuenta en [developers.facebook.com](https://developers.facebook.com) con el email de Ranko.
2. Crear una app de tipo **Business** → agregar el producto **WhatsApp**.
3. En *WhatsApp → API Setup* ya hay un **número de prueba** gratuito:
   - Copiar `Phone number ID` → `WHATSAPP_PHONE_NUMBER_ID`
   - Copiar el token temporal → `WHATSAPP_ACCESS_TOKEN` (dura 24 h; para algo
     estable crear un **System User** en Business Settings con token permanente)
   - Registrar hasta 5 números de test (el tuyo, el de Pehuen, un técnico).
4. Configurar el webhook (*WhatsApp → Configuration*):
   - URL: `https://<deploy>.vercel.app/api/whatsapp/webhook`
   - Verify token: el valor de `WHATSAPP_VERIFY_TOKEN` del `.env`
   - Suscribirse al campo **messages**.
5. `WHATSAPP_APP_SECRET`: App Settings → Basic → App Secret (valida la firma de los webhooks).

### Verificación de negocio (arrancar YA — es el camino crítico)

Para pasar del número de prueba a un número real de Ranko:
1. Crear el **Business Portfolio** de Ranko en [business.facebook.com](https://business.facebook.com).
2. Completar la **verificación de negocio** (Security Center): razón social, CUIT,
   comprobante de domicilio/servicio a nombre de Ranko SRL. Tarda días a semanas —
   por eso se inicia en paralelo al desarrollo.
3. Al aprobarse: agregar un número de teléfono real de Ranko en WhatsApp → API Setup,
   verificar por SMS/llamada, y actualizar `WHATSAPP_PHONE_NUMBER_ID` + token.
   **El código no cambia.**

> Nota: un número que se usa en la Cloud API no puede usarse a la vez en la app
> normal de WhatsApp — conviene una línea nueva dedicada.

## 3. Vercel

1. Crear cuenta en [vercel.com](https://vercel.com) con el email de Ranko (plan Hobby alcanza para el MVP; para uso comercial real corresponde plan Pro).
2. Importar el repo, framework Next.js (detecta solo).
3. Cargar en *Settings → Environment Variables* todas las variables de `.env.example`.
4. Deploy → usar la URL resultante para el webhook de Meta (paso 2.4).

## 4. Desarrollo local con WhatsApp real

Meta necesita una URL pública para el webhook. Para probar el bot en local:

```bash
npm run dev
# en otra terminal, exponer el puerto (cualquiera de los dos):
npx localtunnel --port 3000
# o: cloudflared tunnel --url http://localhost:3000
```

y apuntar el webhook de Meta a esa URL temporal (`https://.../api/whatsapp/webhook`).
