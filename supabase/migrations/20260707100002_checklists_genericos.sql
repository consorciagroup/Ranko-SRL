-- Checklists genéricos para los tipos de trabajo que se cargaron desde el panel
-- sin checklist. Se insertan por NOMBRE del tipo y sólo si ese tipo todavía no
-- tiene ítems, así la migración es idempotente y no pisa checklists ya cargados
-- (ni falla en una base fresca donde estos tipos no existen).

-- Inserta filas de checklist para el tipo `p_nombre`, salvo que ya tenga ítems.
create or replace function _seed_checklist_generico(p_nombre text, p_items jsonb)
returns void language plpgsql as $$
declare
  v_tipo_id uuid;
begin
  select id into v_tipo_id from tipos_trabajo where nombre = p_nombre limit 1;
  if v_tipo_id is null then return; end if;
  if exists (select 1 from checklist_items where tipo_trabajo_id = v_tipo_id) then
    return;
  end if;

  insert into checklist_items (tipo_trabajo_id, orden, texto, tipo_dato, obligatorio)
  select
    v_tipo_id,
    (elem->>'orden')::int,
    elem->>'texto',
    (elem->>'tipo_dato')::tipo_dato,
    (elem->>'obligatorio')::boolean
  from jsonb_array_elements(p_items) as elem;
end;
$$;

select _seed_checklist_generico('Limpieza de matafuegos', '[
  {"orden":1,"texto":"Foto de los matafuegos antes de la limpieza","tipo_dato":"foto","obligatorio":true},
  {"orden":2,"texto":"¿Se limpiaron todos los matafuegos del sector?","tipo_dato":"si_no","obligatorio":true},
  {"orden":3,"texto":"Cantidad de matafuegos limpiados","tipo_dato":"numero","obligatorio":true},
  {"orden":4,"texto":"Foto de los matafuegos después de la limpieza","tipo_dato":"foto","obligatorio":true},
  {"orden":5,"texto":"Observaciones generales","tipo_dato":"texto","obligatorio":false}
]'::jsonb);

select _seed_checklist_generico('Limpieza de pared  lateral del edificio', '[
  {"orden":1,"texto":"Foto de la pared antes de la limpieza","tipo_dato":"foto","obligatorio":true},
  {"orden":2,"texto":"¿Se completó la limpieza de la superficie asignada?","tipo_dato":"si_no","obligatorio":true},
  {"orden":3,"texto":"Metros cuadrados limpiados","tipo_dato":"numero","obligatorio":false},
  {"orden":4,"texto":"Foto de la pared después de la limpieza","tipo_dato":"foto","obligatorio":true},
  {"orden":5,"texto":"Observaciones generales","tipo_dato":"texto","obligatorio":false}
]'::jsonb);

select _seed_checklist_generico('Mantenimiento de ascensor', '[
  {"orden":1,"texto":"¿Se revisó el sistema de frenos?","tipo_dato":"si_no","obligatorio":true},
  {"orden":2,"texto":"¿Se lubricaron las guías y poleas?","tipo_dato":"si_no","obligatorio":true},
  {"orden":3,"texto":"¿Funcionan correctamente las puertas y sensores?","tipo_dato":"si_no","obligatorio":true},
  {"orden":4,"texto":"Foto del tablero de control","tipo_dato":"foto","obligatorio":true},
  {"orden":5,"texto":"Observaciones generales","tipo_dato":"texto","obligatorio":false}
]'::jsonb);

drop function _seed_checklist_generico(text, jsonb);
