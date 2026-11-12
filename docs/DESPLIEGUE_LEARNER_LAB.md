# Publicar Mimo en AWS Amplify desde Learner Lab

Entrega local del 12 de noviembre de 2026. Esta guía no implica que el frontend ya esté publicado ni que el backend haya sido reparado.

## Qué recibirás

- `mimo-amplify-2026-11-12.zip`: sitio compilado que debes cargar en Amplify.
- `amplify-rewrites.json`: reglas para abrir y recargar las rutas de React.
- `customHttp.yml`: encabezados de seguridad.
- `SHA256SUMS.txt`: huellas de los archivos de configuración y del sitio.
- `RESULTADOS.md` y evidencias JSON: pruebas realizadas y limitaciones.

El archivo exterior `mimo-entrega-2026-11-12.zip` es el paquete para compartir. **Extráelo primero; no subas ese ZIP exterior como sitio.** El ZIP interior del sitio contiene `index.html` y `assets/` directamente en la raíz. No contiene código fuente, node_modules, contraseñas ni fixtures demo.

## 1. Entrar al entorno correcto

El compañero responsable inicia su Learner Lab, espera a que esté disponible y entra a la consola AWS desde el laboratorio. Selecciona `us-east-1` para trabajar junto a los servicios existentes.

Confirma que el laboratorio permite utilizar Amplify Hosting y que no hay restricciones de presupuesto o permisos. Si la consola devuelve AccessDenied, anota la operación y consulta al responsable del laboratorio; no cambies roles o políticas de los servicios existentes para intentar resolverlo. Iniciar el laboratorio no repara automáticamente un error de API.

## 2. Crear una app nueva y cargar el sitio

En Amplify, elige **Create new app → Deploy without Git → Next**. Usa un nombre como `mimo-frontend-pruebas` y una rama `pruebas`. Elige **Drag and drop**, carga **mimo-amplify-2026-11-12.zip** y pulsa **Save and deploy**. Espera a que termine y guarda la URL que aparezca. No reemplaces la app del otro frontend.

Este método no requiere conectar GitHub ni instalar Node en la computadora del compañero. Los commits futuros de GitHub no actualizarán automáticamente este despliegue. [Procedimiento oficial de despliegue manual](https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html).

## 3. Configurar las rutas internas

Abre **Hosting → Rewrites and redirects → Manage redirects**. En la app nueva, coloca el contenido completo de `amplify-rewrites.json` y guarda. La regla debe ser una **reescritura 200**, no una redirección 301/302. Sirve index.html para las rutas de React y mantiene separados los archivos JS/CSS.

Comprueba que `/personas` abre la aplicación al escribir la dirección directamente. Al recargar aparecerá el login porque la sesión se guarda en memoria; eso es esperado. Después de autenticar, debe abrirse la ruta correspondiente según el rol. [Instrucciones de AWS](https://docs.aws.amazon.com/amplify/latest/userguide/creating-editing-redirects.html).

## 4. Aplicar los encabezados

En la configuración de **Custom headers** de esa app, utiliza el YAML de `customHttp.yml`. Si Amplify indica que requiere un nuevo despliegue para aplicarlo, vuelve a desplegar el mismo ZIP.

En el despliegue manual los encabezados se configuran en la consola; el YAML que acompaña el paquete no se aplica solo por estar junto al ZIP. Comprueba en DevTools → Network la presencia de Content-Security-Policy y X-Content-Type-Options en la respuesta del sitio. [Encabezados personalizados en Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/custom-headers.html).

## 5. Probar las APIs desde el dominio publicado

El sitio ya incluye las siete URLs AWS configuradas. No necesita claves AWS ni variables de autenticación en Amplify. Utiliza una cuenta **de Mimo**, no el correo/contraseña de la consola AWS.

1. Abre la URL de la app y DevTools → Network.
2. Inicia sesión con una cuenta de prueba del equipo. La solicitud es POST `/dev/auth/login` al servicio de usuarios.
3. Si el login funciona, consulta personas, nóminas, asistencia y perfil. Prueba los roles disponibles y dos empresas por separado, cerrando sesión entre cuentas.
4. Si falla, guarda la hora, ruta, estado HTTP y request ID cuando aparezca. No compartas tokens ni contraseñas en capturas.
5. Si funciona en Postman pero falla en el navegador, revisa el error concreto de CORS o CSP. CORS se configura en las APIs; los encabezados del sitio no lo sustituyen. Prueba el preflight y las respuestas reales desde el origen exacto de Amplify.

Para aislar el login en Postman: POST a `https://ckuqmvszfj.execute-api.us-east-1.amazonaws.com/dev/auth/login`, Body → raw → JSON con `email` y `password` de la cuenta Mimo. Si devuelve una sesión válida, copia su token a Authorization → Bearer Token para las consultas protegidas. Nunca lo agregues al código fuente.

## 6. Qué hacer con los errores actuales

El 12 de noviembre, cuatro cuentas devolvieron HTTP 500 en login y cuatro servicios devolvieron 500 en `/ping`. Por eso no se certifican operaciones reales. Publicar el frontend no corrige esos errores.

El responsable de AWS debe consultar las integraciones API Gateway/Lambda y CloudWatch usando las horas e identificadores de las evidencias. Un 401 sin token es esperado, pero no prueba que el código de negocio funcione. Tampoco un OPTIONS 200 valida una contratación o una nómina.

## 7. Antes de presentar el proyecto

- [ ] Login válido y errores legibles.
- [ ] Consultas reales en todos los módulos y roles disponibles.
- [ ] Separación entre empresas comprobada en el servidor, no solo en menús.
- [ ] Altas y ediciones con registros de prueba acordados.
- [ ] Contratación, onboarding y planillas comprobados hasta su resultado final; una solicitud aceptada no equivale a procesamiento terminado.
- [ ] CV en S3 y descarga PDF/CSV desde el dominio publicado.
- [ ] Rutas internas al recargar y menú en móvil.
- [ ] Confirmaciones revisadas antes de cese, contratación o generación de planillas.

La demo automatizada usa respuestas controladas. Sus 158 comprobaciones aprobadas no sustituyen esta revisión real. No uses personas reales para experimentar con acciones irreversibles o que disparan avisos.

## 8. Actualizar la app después

Para una nueva versión, genera un nuevo ZIP del contenido de dist y cárgalo en la misma app/rama manual. Conserva el ZIP anterior por si necesitas restaurarlo. Si cambian URLs API, el desarrollador debe recompilar con las nuevas variables VITE antes de entregarte el ZIP: cambiar una variable en consola no modifica JavaScript ya compilado.

En el proyecto local del desarrollador, los comandos de comprobación son `npm test`, `npm run lint`, `npm run build`, `npm run test:demo` y `npm run test:health`. Este último permite definir `HCM_TEST_ORIGIN` con la URL HTTPS publicada para comprobar CORS desde ese origen; solo valida disponibilidad/preflight/rechazo sin token, no operaciones autenticadas.
