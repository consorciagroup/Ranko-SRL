-- Índices adicionales para la tabla `visitas`.
--
-- Migración aditiva e idempotente: el modelo inicial (20260702000001) ya podría
-- estar aplicado en el proyecto remoto vinculado (ver supabase/.temp/), así que
-- no se edita esa migración; se agregan índices que faltaban para los patrones
-- de query reales del código.
--
-- Patrones cubiertos:
--   * Dashboard y panel de rutas: `where fecha = ? order by orden`
--     (src/app/page.tsx, src/app/rutas/page.tsx, DashboardLive.tsx).
--   * Bot: `where tecnico_id = ? and fecha = ? and estado in (...) order by orden`
--     (src/lib/bot/menu.ts -> visitasPendientesDe).
--   * FKs sin índice (direccion_id, tipo_trabajo_id): aceleran los joins a
--     direcciones/tipos_trabajo y las verificaciones de integridad referencial.
--
-- El índice del modelo inicial `visitas_fecha_idx (fecha, tecnico_id)` se mantiene
-- (sirve al bot cuando arranca por técnico); estos lo complementan.

-- Filtro por día + ordenamiento por orden (patrón dominante del panel).
create index if not exists visitas_fecha_orden_idx
  on visitas (fecha, orden);

-- Ruta pendiente de un técnico en un día (bot). Antepone tecnico_id porque el
-- bot siempre filtra por técnico; incluye orden para el `order by orden` final.
create index if not exists visitas_tecnico_fecha_idx
  on visitas (tecnico_id, fecha, orden);

-- FKs sin índice: joins y borrados referenciales.
create index if not exists visitas_direccion_idx
  on visitas (direccion_id);

create index if not exists visitas_tipo_trabajo_idx
  on visitas (tipo_trabajo_id);
