# Mejoras y verificación — 12 de noviembre de 2026

## Implementado localmente

- Selector de personas por nombre, área o correo, con páginas adicionales, errores y reintento. Envía el ID original al servidor. La búsqueda filtra únicamente personas cargadas; no se presenta como búsqueda global del backend. Sin caché compartida entre sesiones o empresas.
- Los roles sin acceso al directorio conservan la entrada por código. No se amplían permisos del servidor.
- Ficha de empleado conectada con nóminas, asistencia, desempeño e incorporación mediante enlaces que conservan la selección. Los empleados no pueden elegir otra persona con el parámetro de URL en esos módulos.
- Siguiente paso después de contratar: verificar que la ficha aparezca y consultar incorporación. La recepción de una solicitud no se presenta como confirmación de que los eventos hayan terminado.
- Filtros activos con limpieza, confirmaciones con efectos explícitos y mensajes después de registrar conceptos o solicitar planillas.
- Tipos de respuesta para empleados, vacantes, evaluaciones, notificaciones y tareas. PageData ahora es genérico. Quedan estructuras flexibles en editores y algunos contratos: no se afirma una migración completa desde any.
- Diagnóstico reproducible sin credenciales: npm run test:health.

## Verificación

158 comprobaciones demo aprobadas: 144 combinaciones de ruta/rol/ancho y 14 flujos adicionales, incluidos selector paginado, búsqueda, ID enviado, navegación a incorporación, cancelación de cese, documento inválido, protección de parámetros por rol y los casos existentes. Sin errores JavaScript ni endpoints de prueba imprevistos. Las respuestas se interceptan en el navegador de pruebas; esto no certifica AWS.

19 pruebas unitarias aprobadas. TypeScript, Oxlint y compilación de producción correctos. Se revisaron las capturas de escritorio y móvil y se amplió a ancho completo el selector en móvil.

## AWS: bloqueo comprobado nuevamente

Los cuatro logins documentados devolvieron HTTP 500. El diagnóstico público registró siete rechazos 401 sin token, siete preflights 200 y cuatro /ping con HTTP 500. Evidencia: aws-login.json y aws-health.json, con tiempos UTC y request IDs donde están disponibles.

No se obtuvieron sesiones reales; por ello no se ejecutaron CRUD autenticados, aislamiento entre empresas, contratación real, cese, generación de planillas ni archivos S3/PDF. El aislamiento del frontend no demuestra aislamiento en el backend.

## Despliegue

Paquete local actualizado: mimo-amplify-2026-11-12.zip. Incluye únicamente dist y no contiene fixtures demo. No se sustituyó el ZIP anterior que ya tenía cambios del usuario.

No se publicó esta versión. El usuario confirmó que todavía no tiene app en Amplify y pidió entregar el paquete e instrucciones para que su compañero cree y publique la app desde Learner Lab. No se alteraron AWS ni GitHub. Los cambios previos del usuario (incluida la eliminación de recursos gráficos antiguos) se conservaron.

Después de recuperar el backend: probar dos empresas y todos los roles con test:live, acordar registros para escrituras y comprobar los efectos asíncronos. Publicar el ZIP en la app confirmada, aplicar las reglas SPA y encabezados incluidos, y verificar CORS/rutas/archivos desde ese dominio.

Revisión adicional tras ampliar el selector móvil: 46 comprobaciones del rol administrador aprobadas. Ver layout-final-results.json.
