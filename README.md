# Mimo · Personas primero

Frontend local original de HCM, construido con React, TypeScript, React Router y Vite. Integra las siete APIs AWS existentes del proyecto de referencia. No tiene modo demo, repositorio remoto, datos de negocio incluidos ni autenticación simulada.

## Estado de entrega

La compilación de producción y las 19 pruebas unitarias del cliente pasan. **El backend actual bloquea el uso autenticado: `/auth/login` devuelve HTTP 500**, tanto con correo/contraseña como incluyendo tenant, y `/ping` también devuelve 500 en cuatro servicios. Confirmado por HTTP y desde el navegador el 10 de noviembre de 2026 (Lima). No es posible certificar los recorridos autenticados ni las escrituras reales hasta que el equipo backend restablezca AWS. Ver `docs/VERIFICACION.md`.

## Ejecutar

Requiere Node >= 22.18 (verificado con Node 24.16) y npm.

```sh
npm ci
npm run dev
```

Abre la URL que imprime Vite. Si 5173 está ocupado utilizará el siguiente puerto disponible. Las cuentas son las reales del backend: no hay credenciales incorporadas ni botones para saltarse el acceso.

```sh
npm test
npm run check
npm run build
npm run preview
```

`dist/` es el sitio estático listo para alojar. El build incluye la comprobación de TypeScript. `npm test` utiliza respuestas controladas exclusivamente en el transporte de las pruebas unitarias; no proporciona datos a la aplicación ni certifica una integración real.

## Módulos

- Inicio: resumen de empleados, distribución por área, nómina del mes, saldo personal y notificaciones recibidas.
- Personas: alta, detalle, edición, estado/cese, filtros por área/estado, búsqueda dentro de la página y paginación del servicio.
- Organización: consulta por área o jefe, grupos y paginación.
- Usuarios: alta, consulta, detalle, edición de nombre/rol/estado; protección de la propia cuenta.
- Perfil: datos personales, edición de contacto y cambio de contraseña real.
- Nóminas: boletas, detalle, PDF, historial, planillas, generación/recalculo asíncrono, conceptos, liquidación.
- Bandas salariales: consulta, alta y actualización.
- Asistencia: entrada/salida, registro manual RR. HH., filtros, resumen diario, CSV, solicitudes, pendientes, resolución y saldo.
- Reclutamiento: vacantes, postulaciones con datos reales, carga de PDF mediante URL firmada y cambios de etapa/contratación.
- Onboarding: consulta, creación y finalización de tareas.
- Desempeño: evaluaciones, competencias, objetivos, puntaje, comentarios y reconocimientos.
- Notificaciones: filtros y marcar como leída.

Los roles controlan navegación y acciones. La seguridad de autorización y separación de tenants depende del backend; se explican brechas existentes en `docs/LIMITACIONES_BACKEND.md`.

## Configuración

Las URLs AWS públicas están en `src/lib/api.ts`. Copia `.env.example` a `.env.local` solo si necesitas reemplazarlas. Nunca guardes claves AWS, contraseñas o tokens en variables VITE: son públicas en el bundle.

El token se mantiene en memoria. Recargar o cerrar la pestaña exige iniciar sesión nuevamente. Un HTTP 401 o el vencimiento del token cierra la sesión. No hay renovación de sesión porque el backend no ofrece refresh tokens. Los errores de contraseña actual no cierran la sesión.

Los importes son PEN salvo las bandas salariales. Fechas operativas en America/Lima. Las ausencias validan 15 días de anticipación y hasta 90 días de duración. Los formularios muestran errores del servidor; las escrituras no se reintentan automáticamente.

## Pruebas reales

`npm run test:live` ejecuta login y lecturas usando `HCM_TEST_EMAIL` y `HCM_TEST_PASSWORD` proporcionadas en el entorno. No guardes estas variables en el repositorio ni en comandos compartidos. Ejecuta por separado con cuentas de dos empresas y con distintos roles después de que AWS vuelva a responder.

No se han creado, eliminado, modificado ni contratado personas; no se han generado planillas ni enviado notificaciones durante la verificación. Para probar escrituras de punta a punta se necesitan registros reales autorizados por el equipo o un ambiente de pruebas aprobado. No se elude la autenticación para presentar el sitio como funcional.

## Desplegar en Amplify

No se ha publicado ni alterado AWS. Para desplegar cuando el backend esté disponible:

1. Ejecuta `npm ci`, `npm test` y `npm run build`.
2. Despliega el contenido de `dist/` en Amplify Hosting mediante el procedimiento de tu equipo. También se incluye `amplify.yml` para un build automatizado si más adelante se conecta una fuente.
3. Configura la regla SPA incluida en `docs/amplify-rewrites.json` para que las rutas de React Router respondan con `index.html` al recargar.
4. Aplica `customHttp.yml` como encabezados de seguridad. Si cambias de región o dominio de S3, ajusta `connect-src` para ese destino explícito.
5. Verifica el login, las rutas profundas, las descargas y CORS desde el dominio publicado.

## Estructura

- `src/components/ui.tsx`: controles, formularios, tablas, diálogos accesibles y consultas con cancelación.
- `src/lib`: cliente API, sesión, tipos y formatos.
- `src/features`: módulos por dominio.
- `src/App.tsx`: acceso, navegación, rutas y permisos.
- `tests`: pruebas unitarias y ejecutor de consultas reales.
- `docs`: inventario de contratos, verificación y limitaciones.

La plantilla original está respaldada en `.mimo-original/`. Solo se modificó este proyecto local. GitHub fue utilizado exclusivamente en modo lectura.
