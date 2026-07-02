# Cosas para pedirle / confirmar con Pehuen

Lista viva — tachar cuando se resuelva. Los primeros 4 vienen del brief (sección 7).

## Pedidos de material

- [ ] **Logo de Ranko en buena calidad** — SVG/AI (vectorial) o PNG de 1000px+ de ancho. Hoy usamos un thumbnail de 220px sacado del sitio web (`public/logo-ranko.png`); alcanza para el panel pero no para el reporte PDF que va al cliente final. Reemplazo directo del archivo, sin tocar código.
- [ ] **Reportes de ejemplo del registro actual** (papel/Excel) — ya pedidos por WhatsApp, respuesta pendiente. Sirven de referencia de formato para el reporte final.
- [ ] **Checklist detallado por tipo de instalación** (matafuegos, rociadores, detección de humo, limpieza de tanque, bombas) — qué ítems y qué tipo de dato pide cada uno. Ya pedido por WhatsApp. Al ser data-driven se cargan desde el panel, sin código.

## Decisiones pendientes

- [ ] **Método de firma/certificación** — hoy papel. ¿Foto de evidencia alcanza o hace falta firma digital? ¿Alguna normativa (IRAM, ley de bomberos, seguros) exige formato específico?
- [ ] **Canal de entrega de alertas** — ¿mail, WhatsApp, solo dashboard? ¿A quién: Pehuen, empleados específicos, ambos?
- [ ] **Visita ad-hoc** (técnico llega a una dirección sin visita asignada) — ¿pasa lo suficiente como para soportarlo en v1?

## Para el arranque en producción

- [ ] **Números de WhatsApp de los técnicos** que van a probar el sistema (para darlos de alta y registrarlos como destinatarios de prueba en Meta mientras dure la verificación).
- [ ] **Línea de teléfono dedicada para el bot** — el número que use la API de WhatsApp no puede usarse a la vez en la app normal de WhatsApp; conviene una línea nueva a nombre de Ranko.
- [ ] **Datos para la verificación de negocio en Meta** — CUIT, comprobante de domicilio/servicio a nombre de Ranko SRL (para pasar del número de prueba al productivo).

## Avisos / misceláneas

- [ ] Comentarle que su WordPress tiene imágenes residuales de otros negocios en `/wp-content/uploads` (logo de una panadería "Donna" y de "Indaltec S.A.") — no afecta a nuestro sistema, pero da imagen descuidada en su sitio.
