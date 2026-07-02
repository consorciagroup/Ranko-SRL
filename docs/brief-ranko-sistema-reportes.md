# Brief de proyecto — Sistema de reportes con checklist por WhatsApp (Ranko SRL)

> Este brief describe el problema, los flujos y las reglas de negocio confirmadas con el cliente. **No define stack técnico** — eso queda a resolver en la sesión de planificación con Code, en base a este documento.

## 1. Contexto

Ranko SRL es una empresa de ingeniería contra incendios (Buenos Aires, Argentina, constituida en 1994, CUIT activo). Nos contrataron para diseñarles un sistema propio de reportes de inspección/mantenimiento, con checklist completado por sus técnicos vía WhatsApp.

**Problema confirmado con el cliente (Pehuen Cittadini, CEO):** falta de trazabilidad de los reportes y falta de transparencia del técnico hacia la base — hoy no tienen forma ordenada de saber qué se hizo, cómo, y con qué evidencia.

## 2. Actores

- **Logística (Ranko):** arma las rutas diarias, asigna técnicos, define/edita los checklists por tipo de trabajo.
- **Técnico (Ranko):** ejecuta las visitas en campo, completa el checklist vía WhatsApp.
- **Supervisor (Ranko):** revisa el reporte antes de que salga al cliente final.
- **Cliente final de Ranko:** recibe el reporte (fuera del alcance directo del sistema, por ahora).

## 3. Modelo de datos — conceptos clave

### Visita (entidad atómica)
Cada combinación **dirección + tipo de trabajo + técnico + día** es una visita independiente con su propio estado y su propio checklist. Una misma dirección puede generar varias visitas el mismo día si tiene varios tipos de trabajo asignados (ej: limpieza de tanque + renovación de matafuegos = 2 visitas).

La "parada" (dirección + día) **no es una entidad de datos**, es solo una agrupación visual en la UI de logística y en el bot del técnico.

### Estados de visita
```
asignada → en curso → completada (técnico) → en revisión (supervisor) → aprobada/enviada
```
Variantes que no bloquean el flujo:
- `con observación` — sigue el flujo, queda marcada
- `sin acceso` — cliente ausente; requiere evidencia (foto/video) + motivo + horario de salida. La reprogramación la gestiona Ranko directamente con el cliente, el técnico no interviene.

### Ítem de checklist
Cada ítem tiene:
- Un tipo de dato: sí/no, texto libre, foto, medición numérica (varía por tipo de instalación, ver sección 6 - pendiente)
- Un estado: `completo` / `incompleto (con motivo)` / `observación`
- Un motivo, obligatorio si el estado es `incompleto`

**Los checklists son data-driven**, no hardcodeados por tipo de trabajo. Logística tiene que poder crear un tipo de trabajo nuevo y su checklist asociado sin depender de un dev.

## 4. Flujo — Panel de logística (interfaz 1)

1. Arma la ruta diaria en orden: elige técnico → elige direcciones → elige tipo(s) de trabajo por dirección (multi-select; cada tipo elegido genera una visita).
2. La ruta puede armarse con anticipación (día anterior) o el mismo día — ambos casos deben soportarse, no hay un momento fijo de armado.
3. Logística puede modificar una ruta ya en curso (agregar/sacar paradas). Cuando lo hace, el técnico tiene que recibir una notificación automática vía WhatsApp avisando el cambio (no debe tener que preguntar).
4. Logística administra el catálogo de tipos de trabajo y construye/edita el checklist de cada uno (constructor de formularios: ítems + tipo de dato + obligatoriedad).
5. Dashboard en tiempo real de las visitas del día (estado de cada una, para detectar atrasos). **Esto es alcance de v1, no de una fase futura.**
6. Recibe alertas según reglas:
   - Ítem fallido en un checklist
   - Visita no iniciada a las 9am (tolerancia desde las 8am)
   - Técnico no inició el flujo después de cierto horario
   - Canal de entrega de la alerta: pendiente (ver sección 6)

## 5. Flujo — Bot del técnico (interfaz 2, WhatsApp)

1. Recibe la lista completa de paradas asignadas en un solo mensaje (formato menú, no goteo secuencial).
2. Elige libremente el orden en que las va a hacer (no viene fijo).
3. Al llegar a una parada con varios trabajos asignados, también elige libremente el orden entre ellos.
4. Ejecuta el checklist **guiado, ítem por ítem** (conversacional — no es un formulario que se completa de una).
5. Si un ítem no se puede completar, el bot pide el motivo automáticamente y lo guarda como `incompleto (con motivo)`. Un ítem fallido **no bloquea** el cierre de la visita, sigue con observación.
6. Si el cliente no está / no da acceso: el técnico carga evidencia (foto o video) + motivo + horario de salida, y marca la visita como `sin acceso`. No gestiona reprogramación — eso lo resuelve Ranko directamente.
7. Visita ad-hoc (llegar a una dirección sin visita asignada): posible pero de baja frecuencia esperada — pendiente de confirmar necesidad real (ver sección 6).

## 6. Decisiones de arquitectura ya tomadas (no técnicas de stack, pero condicionan el diseño)

- **Canal:** WhatsApp Business API oficial de Meta, a nombre de Ranko SRL desde el arranque. Ranko ya tiene entidad legal formal constituida, así que no hay bloqueo burocrático para acceder a la API oficial (a diferencia de Consorcia, que hoy usa una librería no oficial por ese mismo motivo).
- **No se requiere WhatsApp Flows** (formularios interactivos) — el checklist es conversacional guiado, ítem por ítem. Confirmado explícitamente por el cliente.
- **No se requiere offline-first.** Hay conectividad generalmente garantizada en los lugares de trabajo (sótanos, salas de máquinas incluidos). El cliente priorizó explícitamente simplicidad y estética por sobre soporte offline.
- **Dashboard en tiempo real es parte del MVP**, no una fase futura — requiere que el estado de cada visita se actualice en vivo, no solo al cierre.
- **Revisión humana obligatoria** antes de que un reporte salga al cliente final. Una visita puede quedar "en revisión" indefinidamente sin bloquear el resto del sistema.

## 7. Open items — pendientes de confirmar con el cliente (Pehuen)

Estos puntos están sin cerrar y pueden afectar decisiones de diseño. No son bloqueantes para arrancar el plan técnico, pero hay que tenerlos presentes:

1. **Checklist detallado por tipo de instalación** (matafuegos, rociadores, detección de humo, limpieza de tanque, bombas contra incendio, etc.) — qué ítems específicos y qué tipo de dato pide cada uno. *Ya se le pidió por WhatsApp, respuesta pendiente.*
2. **Método de firma/certificación** — hoy es en papel; falta definir si pasa a foto de evidencia o firma digital, y si alguna normativa (IRAM, ley de bomberos, seguros) exige un formato específico.
3. **Canal de entrega de alertas** — mail, WhatsApp, dashboard, y a quién van dirigidas (Pehuen, empleados específicos, ambos).
4. **Necesidad real de visita ad-hoc** — confirmar si vale la pena soportarlo o es un caso tan raro que no justifica el desarrollo en v1.

Adicionalmente, ya se le pidieron a Pehuen reportes de ejemplo del registro actual (papel/Excel) para tener referencia de formato real.

## 8. Fuera de alcance de este brief

- Selección de stack técnico (frontend, backend, DB, hosting, proveedor de WhatsApp API) — a definir en la sesión de planning con Code.
- Portal para el cliente final de Ranko (no mencionado como requisito hasta ahora).
- Optimización de rutas / geolocalización avanzada (mencionado como interés a futuro, no como requisito actual).

---
*Brief elaborado a partir del discovery interno post-reunión con Ranko SRL — julio 2026.*
