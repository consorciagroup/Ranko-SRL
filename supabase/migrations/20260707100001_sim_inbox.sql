-- Bandeja del simulador: hilo de mensajes por técnico para probar el flujo del
-- bot sin WhatsApp. Cada fila es un mensaje del hilo (del bot, del técnico, o de
-- sistema). El panel /simulador/[tecnico] la lee y la pintan como un chat; el
-- botón "Enviar ruta por WhatsApp" escribe acá cuando no hay Cloud API config.
create table if not exists sim_inbox (
  id bigint generated always as identity primary key,
  tecnico_id uuid not null references tecnicos (id) on delete cascade,
  -- 'bot'      → payload es un MensajeSalida (texto | botones | lista)
  -- 'tecnico'  → payload { texto } con lo que "mandó" el técnico
  -- 'sistema'  → payload { texto } (avisos del simulador, ej: "reiniciado")
  lado text not null check (lado in ('bot', 'tecnico', 'sistema')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Lectura típica: todo el hilo de un técnico en orden de inserción.
create index if not exists sim_inbox_tecnico_idx on sim_inbox (tecnico_id, id);
