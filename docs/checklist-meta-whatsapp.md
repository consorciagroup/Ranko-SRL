# Checklist — Meta / WhatsApp Cloud API (Ranko SRL)

Estado al 2026-07-08. Ver también `docs/setup-cuentas.md` (paso a paso técnico).

Leyenda: ✅ hecho · 🔲 pendiente · ⏳ en trámite (depende de terceros)

---

## Lo que YA tenemos ✅

- ✅ **Código del webhook** listo (`src/app/api/whatsapp/webhook/route.ts`) — no cambia al pasar de número de prueba a real.
- ✅ **Variables de entorno definidas** en `.env.example` (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`).
- ✅ **Verify token elegido** (`WHATSAPP_VERIFY_TOKEN` cargado en `.env.local`).
- ✅ **Supabase** operativo (base de datos donde se guardan los reportes).
- ✅ **Documentación de setup** escrita (`docs/setup-cuentas.md`).

## Lo que NECESITAMOS 🔲

### A) Setup técnico en Meta (lo hacemos nosotros — rápido, sin papeles)

- 🔲 Crear cuenta en developers.facebook.com con el **email de Ranko** (no personal).
- 🔲 Crear **App tipo Business** + agregar producto **WhatsApp**.
- 🔲 Tomar el **número de prueba** gratuito y cargar en `.env.local`:
  - 🔲 `WHATSAPP_PHONE_NUMBER_ID`  *(hoy vacío)*
  - 🔲 `WHATSAPP_ACCESS_TOKEN`  *(hoy vacío — el temporal dura 24 h)*
- 🔲 `WHATSAPP_APP_SECRET` desde App Settings → Basic  *(hoy vacío)*
- 🔲 Configurar el **webhook** en Meta apuntando a la URL del deploy + suscribir campo `messages`.
- 🔲 Registrar números de test (Facundo, Pehuen, un técnico) para probar el bot.

> Con esto ya se puede desarrollar y demostrar. La verificación de abajo corre en paralelo.

### B) Verificación de negocio de Meta (CAMINO CRÍTICO — arrancar YA) ⏳

Tarda **días a semanas** y no depende de nosotros. Necesitamos que el cliente/Ranko junte:

**Papeles de la SRL:**
- 🔲 Razón social exacta: **Ranko S.R.L.** (tal cual figura inscripta)
- 🔲 **CUIT** de la SRL
- 🔲 **Contrato social / estatuto** de la S.R.L.
- 🔲 **Comprobante de domicilio a nombre de Ranko S.R.L.**, fecha ≤ 90 días (uno de):
  - factura de servicio (luz / gas / internet), o
  - extracto bancario, o
  - certificado / constancia fiscal (AFIP)
  - ⚠️ el nombre y la dirección deben coincidir **exactos** con los del contrato social
- 🔲 **Dirección física**, **teléfono** y **web/dominio** del negocio

**Accesos y decisiones:**
- 🔲 Crear el **Business Portfolio** de Ranko en business.facebook.com (con email de Ranko)
- 🔲 Completar la **verificación de negocio** en el Security Center con los papeles de arriba
- 🔲 Definir el **display name** (nombre que ve el cliente al recibir el mensaje)

### C) Número de teléfono real (una vez aprobada la verificación) ⏳

- 🔲 Conseguir una **línea dedicada** de Ranko (fija o celular) que **hoy NO tenga WhatsApp** activo (o poder borrárselo)
- 🔲 Poder recibir el **código de verificación** por SMS o llamada
- 🔲 Agregar el número en WhatsApp → API Setup y verificarlo
- 🔲 Definir el **PIN de 6 dígitos** (two-step verification)
- 🔲 Reemplazar `WHATSAPP_PHONE_NUMBER_ID` + token por los del número real (el código no cambia)
- 🔲 Crear **System User** en Business Settings → **token permanente** para producción

### D) Plantillas de mensaje (si el bot inicia conversaciones) 🔲

- 🔲 Redactar y enviar a aprobación las **plantillas** (message templates) que use el reporte saliente

---

## Mensaje para pedirle los papeles al cliente

> Para dar de alta el WhatsApp oficial de Ranko necesito:
> 1. Razón social exacta y CUIT de Ranko S.R.L.
> 2. Contrato social / estatuto de la SRL
> 3. Un comprobante de domicilio a nombre de Ranko S.R.L. de los últimos 90 días (factura de servicio, extracto bancario o constancia de AFIP)
> 4. Dirección, teléfono y web del negocio
> 5. Una línea de teléfono dedicada que hoy NO tenga WhatsApp activo (o que podamos borrarle el WhatsApp), donde puedan recibir un SMS/llamada de verificación
> 6. El nombre que quieren que aparezca cuando el cliente recibe el mensaje
