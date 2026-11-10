// Read-only integration checks. Supply credentials through environment variables.
// Never writes accounts, employees, payroll, attendance or other business records.
import { createApi } from "../src/lib/api.ts";
const email = process.env.HCM_TEST_EMAIL,
  password = process.env.HCM_TEST_PASSWORD;
if (!email || !password) {
  console.error(
    "Set HCM_TEST_EMAIL and HCM_TEST_PASSWORD to run authenticated checks.",
  );
  process.exit(2);
}
const session = await createApi()("usuarios", "/auth/login", {
  method: "POST",
  body: { email, password },
});
const api = createApi(session.token);
const user = session.usuario;
const boss = ["admin_rrhh", "gerente"].includes(user.rol);
const checks = [
  ["usuarios", "/usuarios/me"],
  ["notificaciones", "/notificaciones?limit=2"],
];
if (user.empleado_id)
  checks.push(
    ["empleados", "/empleados/me"],
    ["asistencia", "/marcaciones?limit=2"],
    ["asistencia", "/ausencias?limit=2"],
    ["asistencia", "/ausencias/saldo/" + encodeURIComponent(user.empleado_id)],
    [
      "nominas",
      "/nominas/empleado/" + encodeURIComponent(user.empleado_id) + "?limit=2",
    ],
    [
      "desempeno",
      "/evaluaciones?empleado=" + encodeURIComponent(user.empleado_id),
    ],
    ["reclutamiento", "/onboarding/" + encodeURIComponent(user.empleado_id)],
  );
if (boss)
  checks.push(
    ["empleados", "/empleados?limit=2"],
    ["empleados", "/empleados/resumen"],
    ["nominas", "/nominas/resumen"],
    ["nominas", "/nominas/planillas?limit=2"],
    ["asistencia", "/asistencia/resumen"],
  );
if (user.rol === "admin_rrhh") checks.push(["usuarios", "/usuarios?limit=2"]);
if (user.rol !== "empleado") checks.push(["nominas", "/bandas"]);
if (["admin_rrhh", "reclutador"].includes(user.rol))
  checks.push(["reclutamiento", "/vacantes"]);
let failures = 0;
for (const [service, path] of checks) {
  try {
    await api(service, path);
    console.log("PASS", service, path.replace(/emp-[^?/]+/g, "{empleado}"));
  } catch (e) {
    failures++;
    console.error("FAIL", service, e.status, e.message);
  }
}
console.log(
  `${checks.length - failures}/${checks.length} passed. No business mutations performed.`,
);
process.exitCode = failures ? 1 : 0;
