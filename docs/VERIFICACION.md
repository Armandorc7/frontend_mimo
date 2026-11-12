> Actualización del 12 de noviembre de 2026: [mejoras y verificación actual](qa-2026-11-12/RESULTADOS.md). 158 comprobaciones demo aprobadas; login real sigue en HTTP 500. El contenido siguiente conserva evidencia histórica.

# Verificación de Mimo local

Fecha: 10 de noviembre de 2026, America/Lima.

## Actualización: demo y AWS

Se ejecutó después una prueba de interfaz aislada con 153 comprobaciones aprobadas y se repitieron las conexiones reales. El login de AWS sigue devolviendo HTTP 500. Ver [informe y límites de cobertura](qa/RESULTADOS.md). La aplicación de producción sigue sin fixtures ni acceso simulado.

## Comprobaciones completadas

- Compilación de producción TypeScript estricto/Vite correcta. Análisis estático Oxlint revisado.
- Dependencias locales auditadas por npm: 0 vulnerabilidades reportadas.
- 19 pruebas unitarias: cabeceras y cuerpos de solicitudes, manejo de 401/403/500, no reintentar escrituras, error de red, tipo de PDF/CSV, 204, JSON inválido, codificación de tokens y rutas, fecha de Lima, anticipación de ausencias, dinero desconocido y capacidades por rol.
- Navegador real: pantalla de acceso responsive a 319 px y 757 px (sin desbordamiento horizontal), campos, envío real a AWS y mensaje de error del backend. La aplicación permanece sin autenticar y no muestra datos simulados.
- Cuatro intentos de login documentados devuelven 500. Ver `login-results.json`.
- Dos comprobaciones adicionales por tenant con/sin tenant_id devuelven 500 `Internal server error`.
- Siete endpoints protegidos devuelven 401 sin token, siete preflights devuelven 200 y cuatro `/ping` devuelven 500. Ver `aws-health-results.json`.
- Contratos revisados desde los handlers/servicios y el inventario HTTP del repositorio; ver `CONTRATOS.md`.

## Lo que no se puede certificar todavía

No se obtuvo un JWT real porque login falla en AWS. Por ello no se ejecutaron lecturas autenticadas, pruebas visuales de páginas internas con datos reales ni operaciones de escritura. Las pruebas unitarias usan respuestas controladas del transporte únicamente y no se presentan como pruebas contra AWS. No se añadieron fixtures ni modo demo a producción.

No se certifican aislamiento entre tenants, permisos reales, subida S3, descarga de boletas, eventos o CRUD de extremo a extremo mientras no funcione el backend. La aplicación está implementada contra esos contratos y preparada para repetir la verificación, pero no se afirma que las operaciones hayan sido comprobadas en ejecución.

## Repetir cuando se restablezca AWS

1. `npm ci`, `npm test`, `npm run check`, `npm run build`.
2. Configurar HCM_TEST_EMAIL/HCM_TEST_PASSWORD mediante el entorno y ejecutar `npm run test:live` para cada rol/empresa. No incluir claves en documentación o capturas.
3. Abrir `npm run dev` e iniciar sesión con dos empresas por separado. Comprobar que el logout elimina el estado previo y los accesos directos respetan el rol.
4. Recorrer cada módulo, cargar otra página, reintentar fallos, consultar fichas y verificar PDF/CSV.
5. Con autorización explícita sobre registros de prueba, comprobar altas/ediciones, ausencias, vacantes/postulaciones/CV, contratación, evaluaciones, onboarding, usuarios, conceptos y bandas. Las acciones disparadoras de eventos deben coordinarse con el equipo.
6. Probar generación/recalculo de planilla en un periodo aprobado. Confirmar que el proceso pasa de EN_PROCESO al estado que devuelva AWS; comprobar errores y no dar por terminado un proceso solo por recibir 202.
7. Revisar escritorio/tablet/móvil, teclado, diálogos, navegación atrás/adelante y recarga de rutas en Amplify con las reglas SPA instaladas.

GitHub se consultó exclusivamente mediante GET. No hubo commits, pushes, PRs ni cambios remotos. No se modificó configuración AWS ni datos de negocio.
