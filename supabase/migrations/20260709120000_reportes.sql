-- Reportes — compilación de las visitas de una dirección en un período.
-- Un reporte agrupa todos los trabajos (visitas cerradas) hechos en una
-- dirección dentro de un rango de fechas (un día, una semana, un mes…).
-- El vínculo con las visitas se snapshotea en `reporte_visitas` al crear el
-- reporte, así editar/borrar una ruta después no altera un reporte ya generado.

create type estado_reporte as enum ('borrador', 'finalizado');

create table reportes (
  id uuid primary key default gen_random_uuid(),
  direccion_id uuid not null references direcciones(id),
  titulo text not null default 'Informe de inspección',
  periodo_desde date not null,
  periodo_hasta date not null,
  -- Texto libre por ahora (redacción manual). Más adelante lo completa la IA,
  -- igual que Consorcia separa el modo "manual" del "con IA".
  resumen text,
  cierre text,
  estado estado_reporte not null default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reportes_periodo_valido check (periodo_hasta >= periodo_desde)
);

create index reportes_direccion_idx on reportes (direccion_id, periodo_desde desc);

-- Qué visitas entran al reporte y en qué orden (espejo de included_job_ids).
create table reporte_visitas (
  id uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references reportes(id) on delete cascade,
  visita_id uuid not null references visitas(id),
  orden int not null default 0,
  unique (reporte_id, visita_id)
);

create index reporte_visitas_reporte_idx on reporte_visitas (reporte_id, orden);

create trigger reportes_updated_at before update on reportes
  for each row execute function set_updated_at();

-- RLS: lectura pública (igual que el resto del panel MVP; los writes van por el
-- server con service role). Se ajusta a `to authenticated` en la Etapa 2.
alter table reportes enable row level security;
alter table reporte_visitas enable row level security;

create policy "lectura panel" on reportes for select using (true);
create policy "lectura panel" on reporte_visitas for select using (true);
