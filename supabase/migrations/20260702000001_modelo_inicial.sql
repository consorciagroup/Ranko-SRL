-- Modelo de datos inicial — Sistema de reportes Ranko SRL
-- Ver docs/brief y plan: la visita (dirección + tipo de trabajo + técnico + día)
-- es la entidad atómica; la "parada" es solo agrupación visual.

create type tipo_dato as enum ('si_no', 'texto', 'foto', 'numero');

create type estado_visita as enum (
  'asignada',
  'en_curso',
  'completada',
  'en_revision',
  'aprobada',
  'sin_acceso'
);

create type estado_item as enum ('pendiente', 'completo', 'incompleto', 'observacion');

create table tecnicos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  -- E.164 sin '+', como lo entrega Meta en los webhooks (ej: 5491122334455)
  telefono text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table direcciones (
  id uuid primary key default gen_random_uuid(),
  direccion text not null,
  cliente text not null,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table tipos_trabajo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Definición del checklist por tipo de trabajo (data-driven, editable por logística)
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  tipo_trabajo_id uuid not null references tipos_trabajo(id) on delete cascade,
  orden int not null,
  texto text not null,
  tipo_dato tipo_dato not null,
  obligatorio boolean not null default true,
  created_at timestamptz not null default now()
);

create index checklist_items_tipo_trabajo_idx on checklist_items (tipo_trabajo_id, orden);

create table visitas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tecnico_id uuid not null references tecnicos(id),
  direccion_id uuid not null references direcciones(id),
  tipo_trabajo_id uuid not null references tipos_trabajo(id),
  -- orden sugerido dentro de la ruta del día (el técnico igual elige libremente)
  orden int not null default 0,
  estado estado_visita not null default 'asignada',
  con_observacion boolean not null default false,
  sin_acceso_motivo text,
  sin_acceso_evidencia_url text,
  sin_acceso_horario_salida timestamptz,
  iniciada_at timestamptz,
  completada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visitas_fecha_idx on visitas (fecha, tecnico_id);

-- Snapshot del checklist al momento de crear la visita + la respuesta del técnico.
-- Editar un checklist en el catálogo NO afecta visitas ya creadas.
create table visita_items (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references visitas(id) on delete cascade,
  checklist_item_id uuid references checklist_items(id) on delete set null,
  orden int not null,
  texto text not null,
  tipo_dato tipo_dato not null,
  obligatorio boolean not null,
  estado estado_item not null default 'pendiente',
  -- respuesta serializada: 'si'/'no', texto libre o número según tipo_dato
  valor text,
  -- path en Storage para tipo_dato = foto
  evidencia_url text,
  -- obligatorio cuando estado = incompleto
  motivo text,
  respondido_at timestamptz
);

create index visita_items_visita_idx on visita_items (visita_id, orden);

-- Estado de la conversación de WhatsApp por técnico (máquina de estados del bot).
-- Vercel es serverless: todo el estado vive acá, nada en memoria.
create table conversaciones (
  tecnico_id uuid primary key references tecnicos(id) on delete cascade,
  estado jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- updated_at automático
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger visitas_updated_at before update on visitas
  for each row execute function set_updated_at();

create trigger conversaciones_updated_at before update on conversaciones
  for each row execute function set_updated_at();

-- Realtime para el dashboard en vivo
alter publication supabase_realtime add table visitas;

-- RLS: lectura pública (el panel del MVP no tiene auth; los writes van siempre
-- por el server con service role). En Etapa 2, al sumar Supabase Auth, cambiar
-- estas policies a `to authenticated`.
alter table tecnicos enable row level security;
alter table direcciones enable row level security;
alter table tipos_trabajo enable row level security;
alter table checklist_items enable row level security;
alter table visitas enable row level security;
alter table visita_items enable row level security;
alter table conversaciones enable row level security;

create policy "lectura panel" on tecnicos for select using (true);
create policy "lectura panel" on direcciones for select using (true);
create policy "lectura panel" on tipos_trabajo for select using (true);
create policy "lectura panel" on checklist_items for select using (true);
create policy "lectura panel" on visitas for select using (true);
create policy "lectura panel" on visita_items for select using (true);
-- conversaciones: sin policies — solo accesible con service role.

-- Bucket para fotos/videos de evidencia
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;
