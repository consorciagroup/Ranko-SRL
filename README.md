# Ranko — Sistema de reportes

Sistema de reportes de inspección/mantenimiento para Ranko SRL (ingeniería contra
incendios). Dos interfaces:
---

- **Panel de logística** (web): armado de rutas diarias, catálogo de tipos de
  trabajo con constructor de checklists, pantalla de Inicio con el día en
  tiempo real.
- **Bot de WhatsApp** (Meta Cloud API oficial): el técnico recibe sus paradas en
  un menú, elige el orden libremente y completa cada checklist guiado ítem por
  ítem (sí/no, texto, foto, medición), con evidencia en Supabase Storage.

Contexto completo del negocio: [docs/brief-ranko-sistema-reportes.md](docs/brief-ranko-sistema-reportes.md).

## Stack

Next.js (App Router) + Supabase (Postgres, Realtime, Storage) + Meta WhatsApp
Cloud API. Deploy en Vercel.

```
WhatsApp ⇄ /api/whatsapp/webhook ⇄ máquina de estados (src/lib/bot) ⇄ Supabase
                     Panel logística (src/app/*) ⇄ Supabase (+ Realtime en Inicio)
```

- El bot es una máquina de estados **persistida en DB** (tabla `conversaciones`)
  porque Vercel es serverless: `src/lib/bot/engine.ts` contiene la lógica pura
  (testeada en `engine.test.ts`), `src/lib/bot/deps.ts` la conecta a Supabase y
  WhatsApp.
- La **visita** (dirección + tipo de trabajo + técnico + día) es la entidad
  atómica; el checklist se snapshotea en `visita_items` al crearla, así editar el
  catálogo no rompe visitas en curso.
- Estados de visita: `asignada → en_curso → completada → en_revision → aprobada`
  (+ `sin_acceso`, y flag `con_observacion` que no bloquea el flujo).

## Correr el proyecto

```bash
cp .env.example .env.local   # completar credenciales (ver docs/setup-cuentas.md)
npm install
npm run dev                  # panel en http://localhost:3000
npm test                     # tests de la máquina de estados del bot
```

Las credenciales de Supabase, Meta/WhatsApp y Vercel se crean en **cuentas nuevas
a nombre de Ranko** — pasos completos en [docs/setup-cuentas.md](docs/setup-cuentas.md).

## Estructura

```
supabase/migrations/   modelo de datos (aplicar con `supabase db push`)
supabase/seed.sql      datos de ejemplo para la demo
src/lib/whatsapp.ts    wrapper de la Meta Cloud API
src/lib/bot/           máquina de estados del bot + menú de paradas
src/app/               panel de logística (Inicio, rutas, catálogo, ABMs)
src/app/api/whatsapp/  webhook de mensajes entrantes
```
