# Dependencias y limitaciones del backend

## Bloqueo de disponibilidad confirmado

El 10-11-2026, POST `/auth/login` responde 500 `Internal server error` en los dos formatos admitidos (email/password; tenant_id/email/password). Probado con las cuentas documentadas de administración Andina, administración Pacífico, gerente Andina y empleado Andina. También fallan con 500 `/ping` de usuarios, empleados, asistencia y notificaciones. Los siete gateways rechazan correctamente solicitudes sin token con 401 y responden a preflight OPTIONS con 200.

**Acción del equipo backend:** revisar API Gateway/Lambda y logs de los servicios, permisos de invocación, despliegue y dependencias. No se puede concluir la causa exacta a partir de un 500 público. El frontend no puede reparar ese fallo. No se modificó AWS.

## Operaciones que las APIs no ofrecen

- No hay DELETE de empleados, usuarios, vacantes, postulaciones, conceptos, evaluaciones o bandas. Se usan únicamente las transiciones de estado soportadas, como cese e inactivación.
- No hay recuperación de contraseña ni refresh token. Se ofrece el cambio de contraseña autenticado; recargar exige nuevo login.
- Vacantes: solo crear/listar. No editar/cerrar/eliminar. Postulaciones: crear/listar/cambiar estado, sin editar sus datos.
- El CV recibe un PUT firmado al crear la postulación. No hay endpoint de descarga ni renovación del enlace; una subida expirada requiere intervención backend. No se crea otra postulación automáticamente.
- Reconocimientos: solo POST. La interfaz confirma el ID real devuelto, pero no inventa un historial.
- No hay endpoint de pago de planilla. Generar, recalcular, consultar y descargar no implican ejecutar una transferencia bancaria.
- No hay alta de empresas, facturación SaaS o edición de configuración de tenants. La empresa proviene del usuario autenticado.

## Escala y consistencia

- Vacantes, postulaciones, onboarding y evaluaciones consultan DynamoDB sin exponer LastEvaluatedKey. El frontend muestra lo recibido; no puede garantizar un listado completo si la respuesta alcanza el límite de DynamoDB.
- Bandas devuelve hasta 200 elementos. Conceptos no expone token de continuación. Notificaciones devuelve hasta 200 y consulta un conjunto acotado por destinatario. El dashboard indica el alcance de sus contadores de notificaciones.
- Empleados, usuarios, marcaciones, ausencias, planillas y nóminas sí utilizan next_token. La búsqueda de texto de empleados filtra la página actual y se etiqueta así; área/estado se envían al backend.
- Contratar, cesar, generar nómina o completar evaluaciones puede activar SNS/SQS. La interfaz informa del procesamiento asíncrono y no reintenta escrituras automáticamente. Las notificaciones se envían por el backend solamente cuando el usuario ejecuta esas operaciones.
- No existe un contrato de idempotencia para varias escrituras. Ante un fallo de red después de guardar, consulta el listado antes de volver a enviar.

## Permisos que necesitan revisión del backend

Los handlers de reclutamiento, onboarding, evaluaciones y reconocimientos revisados comprueban contexto autenticado/tenant, pero no todos aplican restricciones de rol o de propiedad del empleado. Mimo limita las acciones y consultas desde la interfaz, pero **ocultar controles no garantiza autorización en el servidor**. El equipo backend debe imponer las mismas restricciones antes de usar datos reales sensibles. No se debilitaron controles ni se eludieron autorizadores.

Los roles implementados son admin_rrhh, gerente, reclutador y empleado. Empleados y usuarios mantienen los permisos específicos que sí valida su backend. El cese propio y el cambio del propio rol/estado se impiden también en la interfaz.
