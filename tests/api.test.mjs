import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  createApi,
  query,
  id,
  today,
  absenceMinDate,
  money,
  ApiError,
} from "../src/lib/api.ts";
import { admin, supervisor, recruiter } from "../src/lib/types.ts";
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});
// Controlled transport responses test the client only. The application has no mock mode.
test("login sends no authorization header or tenant guessed by frontend", async () => {
  let received;
  globalThis.fetch = async (url, options) => {
    received = { url, options };
    return Response.json({ token: "unit-token" });
  };
  await createApi()("usuarios", "/auth/login", {
    method: "POST",
    body: { email: "unit@example.invalid", password: "unit-password" },
  });
  assert.equal(received.options.headers.Authorization, undefined);
  assert.equal(JSON.parse(received.options.body).tenant_id, undefined);
  assert.match(received.url, /\/auth\/login$/);
});
test("authenticated request carries Bearer and serializes false correctly", async () => {
  let options;
  globalThis.fetch = async (_, o) => {
    options = o;
    return Response.json({});
  };
  await createApi("unit-token")("usuarios", "/usuarios/id", {
    method: "PATCH",
    body: { activo: false },
  });
  assert.equal(options.headers.Authorization, "Bearer unit-token");
  assert.deepEqual(JSON.parse(options.body), { activo: false });
  assert.equal(options.cache, "no-store");
});
test("401 expires an existing session", async () => {
  let expired = 0;
  globalThis.fetch = async () =>
    Response.json({ error: { mensaje: "Sesión vencida" } }, { status: 401 });
  await assert.rejects(
    createApi("unit-token", () => expired++)("empleados", "/empleados"),
    /Sesión vencida/,
  );
  assert.equal(expired, 1);
});
test("incorrect current password does not log out user", async () => {
  let expired = 0;
  globalThis.fetch = async () =>
    Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  await assert.rejects(
    createApi("unit-token", () => expired++)(
      "usuarios",
      "/auth/cambiar-password",
      { method: "POST", body: {} },
    ),
  );
  assert.equal(expired, 0);
});
test("403 does not expire session and exposes authorization error", async () => {
  let expired = 0;
  globalThis.fetch = async () => new Response("", { status: 403 });
  await assert.rejects(
    createApi("unit-token", () => expired++)("usuarios", "/usuarios"),
    /permiso/,
  );
  assert.equal(expired, 0);
});
test("500 does not fabricate successful data", async () => {
  globalThis.fetch = async () =>
    Response.json({ message: "Internal server error" }, { status: 500 });
  await assert.rejects(
    createApi()("usuarios", "/auth/login", { method: "POST", body: {} }),
    (e) => e instanceof ApiError && e.status === 500,
  );
});
test("network errors are actionable and never automatically retry mutations", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(
    createApi("unit-token")("empleados", "/empleados", {
      method: "POST",
      body: {},
    }),
    /No repitas/,
  );
  assert.equal(calls, 1);
});
test("PDF content type is checked", async () => {
  globalThis.fetch = async () => Response.json({ message: "not a PDF" });
  await assert.rejects(
    createApi("unit-token")("nominas", "/nominas/id/boleta", { format: "pdf" }),
    /documento esperado/,
  );
});
test("PDF download returns binary blob", async () => {
  globalThis.fetch = async () =>
    new Response("%PDF-1.4", {
      headers: { "Content-Type": "application/pdf" },
    });
  const blob = await createApi("unit-token")("nominas", "/nominas/id/boleta", {
    format: "pdf",
  });
  assert.equal(await blob.text(), "%PDF-1.4");
});
test("CSV download returns blob", async () => {
  globalThis.fetch = async () =>
    new Response("fecha,horas\n", {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  assert.match(
    await (
      await createApi("unit-token")("asistencia", "/asistencia/reportes", {
        format: "csv",
      })
    ).text(),
    /fecha,horas/,
  );
});
test("204 returns null", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await createApi()("usuarios", "/usuarios/me"), null);
});
test("invalid JSON is surfaced", async () => {
  globalThis.fetch = async () => new Response("<html>");
  await assert.rejects(
    createApi()("usuarios", "/usuarios/me"),
    /respuesta no válida/,
  );
});
test("query encodes opaque pagination tokens and retains false and zero", () => {
  const p = new URLSearchParams(
    query({
      next_token: "a+/= &",
      activo: false,
      limit: 0,
      empty: "",
      nil: null,
    }).slice(1),
  );
  assert.equal(p.get("next_token"), "a+/= &");
  assert.equal(p.get("activo"), "false");
  assert.equal(p.get("limit"), "0");
  assert.equal(p.has("empty"), false);
});
test("IDs cannot inject route segments", () =>
  assert.equal(id("emp/one?x=1"), "emp%2Fone%3Fx%3D1"));
test("Lima date uses previous day before 05:00 UTC", () =>
  assert.equal(today(new Date("2026-11-10T03:00:00Z")), "2026-11-09"));
test("absence minimum crosses month and year boundaries", () =>
  assert.equal(absenceMinDate(new Date("2026-12-25T12:00:00Z")), "2027-01-09"));
test("absence minimum handles leap year", () =>
  assert.equal(absenceMinDate(new Date("2028-02-20T12:00:00Z")), "2028-03-06"));
test("missing money remains unknown, not zero", () =>
  assert.equal(money(undefined), "—"));
test("role capabilities separate administration, manager, recruiter and employee", () => {
  for (const rol of ["admin_rrhh", "gerente", "reclutador", "empleado"]) {
    const u = { rol };
    assert.equal(admin(u), rol === "admin_rrhh");
    assert.equal(supervisor(u), ["admin_rrhh", "gerente"].includes(rol));
    assert.equal(recruiter(u), ["admin_rrhh", "reclutador"].includes(rol));
  }
});
