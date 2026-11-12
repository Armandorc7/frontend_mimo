// Public diagnostics only: never authenticates or writes business records.
import { endpoints } from "../src/lib/api.ts";
import { mkdir, writeFile } from "node:fs/promises";
const paths = {
  usuarios: "/usuarios/me",
  empleados: "/empleados",
  nominas: "/nominas/planillas",
  asistencia: "/marcaciones",
  reclutamiento: "/vacantes",
  desempeno: "/evaluaciones?empleado=health-check",
  notificaciones: "/notificaciones",
};
const origin = process.env.HCM_TEST_ORIGIN || "http://127.0.0.1:5174";
const checks = Object.entries(paths).flatMap(([service, path]) => [
  { service, path, method: "GET", expected: 401 },
  { service, path, method: "OPTIONS", expected: 200 },
  ...(["usuarios", "empleados", "asistencia", "notificaciones"].includes(
    service,
  )
    ? [{ service, path: "/ping", method: "GET", expected: 200 }]
    : []),
]);
const results = await Promise.all(
  checks.map(async (check) => {
    try {
      const response = await fetch(endpoints[check.service] + check.path, {
        method: check.method,
        signal: AbortSignal.timeout(20000),
        headers: {
          Origin: origin,
          ...(check.method === "OPTIONS"
            ? {
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type",
              }
            : {}),
        },
      });
      const cors = response.headers.get("access-control-allow-origin");
      const passed =
        (response.status === check.expected ||
          (check.method === "OPTIONS" && response.status === 204)) &&
        (cors === "*" || cors === origin);
      return {
        ...check,
        status: response.status,
        cors,
        requestId: response.headers.get("x-amzn-requestid"),
        passed,
      };
    } catch (error) {
      return {
        ...check,
        status: 0,
        error: error instanceof Error ? error.name : "NetworkError",
        passed: false,
      };
    }
  }),
);
const destination = new URL("../docs/health-latest.json", import.meta.url);
await mkdir(new URL("../docs/", import.meta.url), { recursive: true });
await writeFile(
  destination,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      origin,
      scope:
        "Reachability, unauthenticated rejection and CORS; does not certify authenticated operations",
      results,
    },
    null,
    2,
  ),
);
for (const row of results)
  console.log(
    row.passed ? "PASS" : "FAIL",
    row.service,
    row.method,
    row.path,
    row.status,
  );
process.exitCode = results.every((row) => row.passed) ? 0 : 1;
