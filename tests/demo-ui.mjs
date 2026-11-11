// UI-only fixtures. No AWS request leaves this browser context. Never included in the production bundle.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const out = new URL("../docs/qa/", import.meta.url).pathname;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [],
  errors = [],
  requests = [],
  unmatched = [];
const employee = {
  empleado_id: "demo-emp-1",
  nombres: "Persona",
  apellidos: "Demostración",
  email: "persona@example.test",
  documento: "00000001",
  area: "Tecnología",
  cargo: "Analista demo",
  fecha_ingreso: "2026-01-05",
  salario_base: 3500,
  estado: "ACTIVO",
};
const job = {
  vacante_id: "demo-vac-1",
  titulo: "Analista demo",
  area: "Tecnología",
  estado: "ABIERTA",
  fecha_publicacion: "2026-11-01",
};
const note = {
  notificacion_id: "demo-not-1",
  mensaje: "Notificación de prueba de interfaz",
  leida: false,
  created_at: "2026-11-10T12:00:00Z",
};
const task = {
  onboarding_id: "demo-task-1",
  empleado_id: employee.empleado_id,
  tarea: "Revisar bienvenida demo",
  completada: false,
};
const evaluation = {
  evaluacion_id: "demo-eval-1",
  empleado_id: employee.empleado_id,
  periodo: "2026-11",
  estado: "PENDIENTE",
  objetivos: ["Objetivo demo"],
  competencias: ["Trabajo en equipo"],
  puntaje: 4,
};
const payroll = {
  nomina_id: "demo-nom-1",
  empleado_id: employee.empleado_id,
  periodo: "2026-11",
  neto: 3000,
  bruto: 3500,
  estado: "GENERADA",
};
const routes = [
  "/",
  "/personas",
  "/organizacion",
  "/asistencia",
  "/nominas",
  "/bandas",
  "/reclutamiento",
  "/onboarding",
  "/desempeno",
  "/notificaciones",
  "/usuarios",
  "/perfil",
];
for (const role of ["admin_rrhh", "gerente", "reclutador", "empleado"]) {
  let fault = null;
  const people = [{ ...employee }];
  const user = {
    user_id: "demo-user",
    nombre: "Usuario Demo",
    email: "demo@example.test",
    rol: role,
    tenant_id: "DEMO — datos de prueba",
    empleado_id: employee.empleado_id,
  };
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  await context.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (
      url.hostname === "127.0.0.1" ||
      ["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)
    )
      return route.continue();
    if (!url.hostname.endsWith(".execute-api.us-east-1.amazonaws.com")) {
      unmatched.push(req.url());
      return route.abort();
    }
    const p = url.pathname.replace(/^\/dev/, "");
    const method = req.method();
    requests.push({ role, method, path: p });
    let data,
      status = 200;
    if (fault && p === "/empleados" && method === "GET") {
      status = fault;
      data = { message: "Error controlado para prueba" };
    } else if (p === "/auth/login")
      data = {
        token: "demo-token-not-valid-in-aws",
        expires_in: 3600,
        usuario: user,
      };
    else if (p === "/usuarios/me") data = user;
    else if (p === "/usuarios") data = { items: [user] };
    else if (p === "/empleados/resumen")
      data = { total: people.length, por_area: { Tecnología: people.length } };
    else if (p === "/empleados/organigrama")
      data = { grupos: [{ jefe_id: "demo-manager", empleados: people }] };
    else if (p === "/empleados" && method === "POST") {
      const body = req.postDataJSON();
      data = { ...body, empleado_id: "demo-created", estado: "ACTIVO" };
      people.push(data);
      status = 201;
    } else if (p === "/empleados") data = { items: people };
    else if (p.startsWith("/empleados/")) {
      const found = p.endsWith("/me")
        ? people[0]
        : people.find((x) => x.empleado_id === p.split("/").at(-1));
      if (method === "PUT") Object.assign(found, req.postDataJSON());
      data = found;
    } else if (p === "/nominas/resumen")
      data = { estado: "GENERADA", total_neto: 3000, procesados: 1 };
    else if (p.startsWith("/nominas/empleado/"))
      data = { nominas: { items: [payroll] } };
    else if (p === "/nominas/planillas")
      data = {
        items: [
          {
            periodo: "2026-11",
            estado: "GENERADA",
            total_neto: 3000,
            procesados: 1,
          },
        ],
      };
    else if (p === "/nominas/conceptos") data = { items: [] };
    else if (p === "/nominas") data = { items: [payroll] };
    else if (p.startsWith("/nominas/liquidaciones/")) {
      status = 404;
      data = { message: "Sin liquidación demo" };
    } else if (p.startsWith("/nominas/")) data = { ...payroll, detalle: [] };
    else if (p === "/bandas")
      data = {
        items: [{ cargo: "Analista demo", minimo: 2000, maximo: 5000 }],
      };
    else if (p.startsWith("/ausencias/saldo/"))
      data = {
        dias_disponibles: 20,
        dias_usados: 10,
        dias_pendientes: 0,
        anio: 2026,
      };
    else if (p === "/asistencia/resumen")
      data = { marcaciones: 1, tardanzas: 0, abiertas: 1 };
    else if (p === "/asistencia/reportes") data = { items: [] };
    else if (p === "/marcaciones")
      data = {
        items: [
          {
            marcacion_id: "demo-mar-1",
            empleado_id: employee.empleado_id,
            fecha: "2026-11-10",
            entrada: "2026-11-10T08:00:00-05:00",
            estado: "ABIERTO",
          },
        ],
      };
    else if (p.startsWith("/ausencias")) data = { items: [] };
    else if (p === "/vacantes") data = [job];
    else if (p.endsWith("/postulaciones"))
      data = [
        {
          postulacion_id: "demo-post-1",
          nombre: "Candidato Demo",
          email: "candidato@example.test",
          estado: "RECIBIDO",
          fecha: "2026-11-09",
        },
      ];
    else if (p.startsWith("/onboarding/")) data = [task];
    else if (p === "/evaluaciones") data = [evaluation];
    else if (p === "/notificaciones") data = { items: [note] };
    else {
      unmatched.push(method + " " + p);
      status = 501;
      data = { message: "Endpoint no cubierto por fixture de prueba" };
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data ?? null),
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (e) => errors.push({ role, message: e.message }));
  await page.goto("http://127.0.0.1:5174/");
  await page.locator("input[name=email]").fill("demo@example.test");
  await page.locator("input[name=password]").fill("demo-password");
  await page.getByRole("button", { name: "Entrar a mi espacio" }).click();
  await page.getByRole("heading", { name: "Hola, Usuario" }).waitFor();
  async function go(path) {
    await page.evaluate((path) => {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, path);
    await page.waitForTimeout(180);
    await page.locator("main h1").waitFor();
  }
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of routes) {
      await go(path);
      const blocked =
        (["/personas", "/organizacion"].includes(path) &&
          !["admin_rrhh", "gerente"].includes(role)) ||
        (path === "/usuarios" && role !== "admin_rrhh") ||
        (path === "/reclutamiento" &&
          !["admin_rrhh", "reclutador"].includes(role)) ||
        (path === "/bandas" && role === "empleado");
      assert.equal(
        await page
          .getByRole("heading", { name: "Acceso restringido", exact: true })
          .count(),
        blocked ? 1 : 0,
      );
      assert.equal(
        await page.getByText("No pudimos mostrar esta pantalla").count(),
        0,
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert.equal(overflow, false, `Overflow ${role} ${width} ${path}`);
      results.push({
        role,
        width,
        path,
        result: "PASS",
        heading: await page.locator("main h1").innerText(),
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  if (role === "admin_rrhh") {
    await go("/");
    await page.screenshot({ path: out + "/demo-desktop.png", fullPage: true });
    await go("/personas");
    await page.getByRole("button", { name: "Ver ficha" }).first().click();
    await page.getByRole("dialog").waitFor();
    await page
      .getByRole("button", { name: "Editar ficha", exact: true })
      .click();
    await page.locator("input[name=cargo]").fill("Cargo editado en demo");
    await page
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click();
    await page.getByText("Ficha guardada correctamente.").waitFor();
    assert.equal(people[0].cargo, "Cargo editado en demo");
    results.push({
      test: "Editar empleado y verificar solicitud PUT",
      result: "PASS",
    });
    await page
      .getByRole("button", { name: "Nuevo empleado", exact: true })
      .click();
    const form = page.getByRole("dialog");
    for (const [name, value] of Object.entries({
      nombres: "Registro",
      apellidos: "Demo",
      email: "nuevo@example.test",
      documento: "00000002",
      area: "Tecnología",
      cargo: "Nuevo cargo",
      fecha_ingreso: "2026-11-10",
      salario_base: "2000",
    }))
      await form.locator(`[name="${name}"]`).fill(value);
    await form
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click();
    await form.waitFor({ state: "hidden" });
    assert.equal(people.length, 2);
    results.push({
      test: "Alta de empleado en memoria de prueba",
      result: "PASS",
    });
    await page.getByLabel("Buscar en la página actual").fill("NO_EXISTE");
    await page.getByText("No hay registros").first().waitFor();
    await page.getByLabel("Buscar en la página actual").fill("");
    results.push({ test: "Filtro sin resultados", result: "PASS" });
    fault = 500;
    await go("/perfil");
    await go("/personas");
    await page.getByText("Error controlado para prueba").waitFor();
    fault = null;
    await page.getByRole("button", { name: "Reintentar" }).click();
    await page.getByRole("button", { name: "Ver ficha" }).first().waitFor();
    results.push({ test: "Error 500 y recuperación", result: "PASS" });
    await page.setViewportSize({ width: 375, height: 812 });
    await go("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Personas", exact: true })
      .click();
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.screenshot({ path: out + "/demo-mobile.png", fullPage: true });
    results.push({ test: "Navegación móvil", result: "PASS" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    fault = 401;
    await go("/perfil");
    await go("/personas");
    await page.getByRole("button", { name: "Entrar a mi espacio" }).waitFor();
    results.push({ test: "401 cierra sesión", result: "PASS" });
  } else {
    await page.getByRole("button", { name: "Cerrar sesión" }).first().click();
    await page.getByRole("button", { name: "Entrar a mi espacio" }).waitFor();
    results.push({ test: `Logout ${role}`, result: "PASS" });
  }
  console.log("PASS role", role);
  await context.close();
}
await browser.close();
await writeFile(
  out + "/demo-results.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      mode: "DEMO: respuestas interceptadas, cero llamadas reales a AWS",
      results,
      errors,
      unmatched,
      requests,
    },
    null,
    2,
  ),
);
assert.deepEqual(errors, []);
assert.deepEqual(unmatched, []);
console.log(JSON.stringify({ checks: results.length, errors, unmatched, out }));
