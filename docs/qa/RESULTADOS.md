# Prueba demo seguida de integración AWS

Fecha: 10 de noviembre de 2026. Tiempos exactos UTC en los archivos JSON.

## Fase 1: interfaz aislada

153 comprobaciones aprobadas. 144 combinaciones de 12 rutas, 4 roles (administrador RR. HH., gerente, reclutador y empleado) y 3 anchos (1440, 768 y 375 px). Comprueban apertura sin error de renderizado, ausencia de desbordamiento horizontal y mensaje de acceso restringido según el rol.

Otras 9 comprobaciones: editar empleado y comprobar PUT; crear empleado en memoria; filtro sin resultados; error 500 y reintento; menú móvil; cierre por 401; cierre manual de sesión en los otros tres roles. Sin errores JavaScript ni endpoints imprevistos. Las consultas y escrituras de esta fase recibieron respuestas de prueba. No se enviaron solicitudes reales a AWS desde ese contexto.

Se corrigió la especificidad CSS del botón de menú móvil, que también aparecía en escritorio. Capturas revisadas visualmente: `demo-desktop.png` y `demo-mobile.png`.

Límite: esta cobertura no equivale a probar cada formulario, pestaña o transición de todos los módulos, ni permisos de servidor, contratos reales o persistencia AWS. Tampoco prueba una exportación PDF/CSV, subida S3 o procesamiento asíncrono real.

## Fase 2: AWS real, sin simulación

- Cuatro cuentas documentadas, de dos empresas y tres roles: POST /auth/login devolvió HTTP 500 en todos los casos.
- Siete rutas protegidas sin token: HTTP 401, como corresponde al control de acceso.
- Siete preflights OPTIONS: HTTP 200 y cabecera CORS.
- GET /ping de usuarios, empleados, asistencia y notificaciones: HTTP 500.
- Login real desde Chrome: HTTP 500; error visible y pantalla interna protegida. Se borraron los campos antes de capturar `aws-login-error.png`.

No se obtuvo JWT, por lo tanto las consultas autenticadas, CRUD real, aislamiento de empresas, S3, PDFs y eventos siguen sin verificarse. No se modificaron registros de negocio, configuración AWS ni GitHub. Los resultados no identifican la causa exacta del error 500.

## Siguiente paso del responsable de AWS

Revisar las integraciones API Gateway/Lambda y sus logs de CloudWatch en us-east-1 para la etapa dev, usando las horas e identificadores request_id de `aws-health.json`. Confirmar que las URLs y cuentas de prueba siguen vigentes. Una sesión cerrada en la consola no demuestra que ese sea el origen del fallo.

Tras recuperar login, ejecutar `npm run test:live` con HCM_TEST_EMAIL y HCM_TEST_PASSWORD en el entorno, para cada rol y empresa. Esa orden solo verifica un subconjunto de lecturas. Las escrituras reales deben comprobarse con registros de prueba acordados, incluyendo sus posibles notificaciones y efectos de contratación/cese.

## Reproducción y evidencia

`npm run test:demo` requiere el frontend en http://127.0.0.1:5174 y Google Chrome instalado. Es una prueba automatizada, no un modo demo accesible en la aplicación normal.

`demo-results.json`, `aws-login.json`, `aws-health.json` y `aws-browser.json` contienen resultados de las ejecuciones. 19 pruebas unitarias, Oxlint y compilación de producción también pasan.
