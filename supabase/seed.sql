-- Datos de ejemplo para desarrollo y demo.
-- Los checklists reales por tipo de instalación los va a mandar Pehuen (open item #1);
-- al ser data-driven, reemplazarlos es carga de datos desde el panel, no código.

insert into tecnicos (id, nombre, telefono) values
  ('a0000000-0000-0000-0000-000000000001', 'Facundo (test)', '5491100000001'),
  ('a0000000-0000-0000-0000-000000000002', 'Técnico demo', '5491100000002');

insert into direcciones (id, direccion, cliente, notas) values
  ('b0000000-0000-0000-0000-000000000001', 'Av. Corrientes 1234, CABA', 'Consorcio Corrientes 1234', 'Encargado: Luis, int. 01'),
  ('b0000000-0000-0000-0000-000000000002', 'Lavalle 850, CABA', 'Edificio Lavalle', null),
  ('b0000000-0000-0000-0000-000000000003', 'Av. Santa Fe 3100, CABA', 'Galería Santa Fe', 'Sala de máquinas en subsuelo 2');

insert into tipos_trabajo (id, nombre) values
  ('c0000000-0000-0000-0000-000000000001', 'Renovación de matafuegos'),
  ('c0000000-0000-0000-0000-000000000002', 'Limpieza de tanque');

insert into checklist_items (tipo_trabajo_id, orden, texto, tipo_dato, obligatorio) values
  ('c0000000-0000-0000-0000-000000000001', 1, '¿Se retiraron los matafuegos vencidos?', 'si_no', true),
  ('c0000000-0000-0000-0000-000000000001', 2, 'Cantidad de matafuegos renovados', 'numero', true),
  ('c0000000-0000-0000-0000-000000000001', 3, 'Foto de los matafuegos instalados con tarjeta de habilitación visible', 'foto', true),
  ('c0000000-0000-0000-0000-000000000001', 4, 'Observaciones generales', 'texto', false),
  ('c0000000-0000-0000-0000-000000000002', 1, 'Foto del tanque antes de la limpieza', 'foto', true),
  ('c0000000-0000-0000-0000-000000000002', 2, '¿Se realizó el vaciado completo?', 'si_no', true),
  ('c0000000-0000-0000-0000-000000000002', 3, 'Foto del tanque después de la limpieza', 'foto', true),
  ('c0000000-0000-0000-0000-000000000002', 4, 'Nivel de cloro residual (ppm)', 'numero', true),
  ('c0000000-0000-0000-0000-000000000002', 5, 'Observaciones generales', 'texto', false);
