# Contratos HTTP existentes

Fuente: lectura de `serverless.yml`, handlers, servicios y Postman en https://github.com/MikoIOS/ProyectoFinalCloud (main, commit b2e18d9df37c31dcca12a6ebce95893901564372). No se modificó el origen.

Los endpoints de negocio están conectados desde la interfaz según permisos. Las rutas /ping son diagnósticos, sin botón de negocio. La descarga PDF usa el formato binario, no la alternativa base64.

| Servicio          | Método | Ruta                                        |
| ----------------- | ------ | ------------------------------------------- |
| ms-asistencia     | GET    | `/ping`                                     |
| ms-asistencia     | POST   | `/marcaciones`                              |
| ms-asistencia     | GET    | `/marcaciones`                              |
| ms-asistencia     | POST   | `/ausencias`                                |
| ms-asistencia     | GET    | `/ausencias`                                |
| ms-asistencia     | GET    | `/ausencias/pendientes`                     |
| ms-asistencia     | GET    | `/ausencias/{ausencia_id}`                  |
| ms-asistencia     | PATCH  | `/ausencias/{ausencia_id}/estado`           |
| ms-asistencia     | GET    | `/ausencias/saldo/{empleado_id}`            |
| ms-asistencia     | GET    | `/asistencia/resumen`                       |
| ms-asistencia     | GET    | `/asistencia/reportes`                      |
| ms-desempeno      | POST   | `/evaluaciones`                             |
| ms-desempeno      | GET    | `/evaluaciones`                             |
| ms-desempeno      | PUT    | `/evaluaciones/{evaluacion_id}`             |
| ms-desempeno      | POST   | `/reconocimientos`                          |
| ms-empleados      | GET    | `/ping`                                     |
| ms-empleados      | POST   | `/empleados`                                |
| ms-empleados      | GET    | `/empleados`                                |
| ms-empleados      | GET    | `/empleados/resumen`                        |
| ms-empleados      | GET    | `/empleados/organigrama`                    |
| ms-empleados      | GET    | `/empleados/me`                             |
| ms-empleados      | PATCH  | `/empleados/me`                             |
| ms-empleados      | GET    | `/empleados/{id}`                           |
| ms-empleados      | PUT    | `/empleados/{id}`                           |
| ms-empleados      | PATCH  | `/empleados/{id}/estado`                    |
| ms-nominas        | POST   | `/nominas/generar`                          |
| ms-nominas        | GET    | `/nominas`                                  |
| ms-nominas        | GET    | `/nominas/resumen`                          |
| ms-nominas        | GET    | `/nominas/planillas`                        |
| ms-nominas        | GET    | `/nominas/planillas/{periodo}`              |
| ms-nominas        | GET    | `/nominas/empleado/{empleado_id}`           |
| ms-nominas        | GET    | `/nominas/liquidaciones/{empleado_id}`      |
| ms-nominas        | GET    | `/nominas/{nomina_id}`                      |
| ms-nominas        | GET    | `/nominas/{nomina_id}/boleta`               |
| ms-nominas        | POST   | `/nominas/conceptos`                        |
| ms-nominas        | GET    | `/nominas/conceptos`                        |
| ms-nominas        | GET    | `/bandas`                                   |
| ms-nominas        | PUT    | `/bandas`                                   |
| ms-notificaciones | GET    | `/ping`                                     |
| ms-notificaciones | GET    | `/notificaciones`                           |
| ms-notificaciones | PATCH  | `/notificaciones/{id}/leida`                |
| ms-reclutamiento  | POST   | `/vacantes`                                 |
| ms-reclutamiento  | GET    | `/vacantes`                                 |
| ms-reclutamiento  | POST   | `/postulaciones`                            |
| ms-reclutamiento  | GET    | `/vacantes/{vacante_id}/postulaciones`      |
| ms-reclutamiento  | PATCH  | `/postulaciones/{postulacion_id}/estado`    |
| ms-reclutamiento  | POST   | `/onboarding`                               |
| ms-reclutamiento  | GET    | `/onboarding/{empleado_id}`                 |
| ms-reclutamiento  | PATCH  | `/onboarding/{empleado_id}/{onboarding_id}` |
| ms-usuarios       | GET    | `/ping`                                     |
| ms-usuarios       | POST   | `/auth/login`                               |
| ms-usuarios       | POST   | `/auth/cambiar-password`                    |
| ms-usuarios       | GET    | `/usuarios/me`                              |
| ms-usuarios       | POST   | `/usuarios`                                 |
| ms-usuarios       | GET    | `/usuarios`                                 |
| ms-usuarios       | GET    | `/usuarios/{id}`                            |
| ms-usuarios       | PATCH  | `/usuarios/{id}`                            |
