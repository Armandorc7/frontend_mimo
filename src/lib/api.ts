import type { RecordData } from "./types";
const env = import.meta.env ?? {};
export const endpoints = {
  usuarios:
    env.VITE_USUARIOS_URL ||
    "https://ckuqmvszfj.execute-api.us-east-1.amazonaws.com/dev",
  empleados:
    env.VITE_EMPLEADOS_URL ||
    "https://39vy8bpqn4.execute-api.us-east-1.amazonaws.com/dev",
  nominas:
    env.VITE_NOMINAS_URL ||
    "https://0f0k9vomdk.execute-api.us-east-1.amazonaws.com/dev",
  asistencia:
    env.VITE_ASISTENCIA_URL ||
    "https://p79musr10g.execute-api.us-east-1.amazonaws.com/dev",
  reclutamiento:
    env.VITE_RECLUTAMIENTO_URL ||
    "https://ts3pqiwi7e.execute-api.us-east-1.amazonaws.com/dev",
  desempeno:
    env.VITE_DESEMPENO_URL ||
    "https://4gchww17uh.execute-api.us-east-1.amazonaws.com/dev",
  notificaciones:
    env.VITE_NOTIFICACIONES_URL ||
    "https://3wfj6ozaga.execute-api.us-east-1.amazonaws.com/dev",
};
export type Service = keyof typeof endpoints;
export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  body?: RecordData;
  signal?: AbortSignal;
  format?: "json" | "pdf" | "csv";
}
export type Api = <T = any>(
  service: Service,
  path: string,
  options?: RequestOptions,
) => Promise<T>;
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export function createApi(token?: string, expired: () => void = () => {}): Api {
  return async <T>(
    service: Service,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> => {
    const { method = "GET", body, signal, format = "json" } = options;
    let response: Response;
    try {
      const timeout = AbortSignal.timeout(35000);
      response = await fetch(endpoints[service].replace(/\/$/, "") + path, {
        method,
        cache: "no-store",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        headers: {
          Accept:
            format === "pdf"
              ? "application/pdf"
              : format === "csv"
                ? "text/csv"
                : "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ApiError(
        "No se pudo conectar con el servicio. Revisa tu conexión o inténtalo nuevamente. No repitas una operación de guardado sin comprobar primero el listado.",
        0,
      );
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 && token && path !== "/auth/cambiar-password")
        expired();
      if (
        response.status >= 500 &&
        (!data?.message || data.message === "Internal server error")
      )
        throw new ApiError(
          `El servicio de ${service} no está disponible (HTTP ${response.status}). Inténtalo más tarde o contacta al administrador.`,
          response.status,
        );
      throw new ApiError(
        data?.error?.mensaje ||
          (typeof data?.error === "string" ? data.error : null) ||
          data?.message ||
          (response.status === 403
            ? "No tienes permiso para esta operación."
            : `El servicio respondió con error ${response.status}.`),
        response.status,
      );
    }
    if (format !== "json") {
      const contentType = response.headers.get("content-type") || "";
      if (
        !(format === "pdf"
          ? contentType.includes("application/pdf")
          : contentType.includes("text/csv"))
      )
        throw new ApiError(
          "El servicio no devolvió el documento esperado.",
          502,
        );
      return (await response.blob()) as T;
    }
    if (response.status === 204) return null as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError("El servicio devolvió una respuesta no válida.", 502);
    }
  };
}
export function query(data: RecordData) {
  const q = new URLSearchParams(
    Object.entries(data)
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v]) => [k, String(v)]),
  );
  return q.size ? `?${q}` : "";
}
export const id = (value: string) => encodeURIComponent(value);
export const label = (value: unknown) =>
  String(value ?? "—")
    .replaceAll("_", " ")
    .toLocaleLowerCase("es")
    .replace(/^./, (c) => c.toUpperCase());
export const fullName = (r: RecordData) =>
  [r.nombres, r.apellidos].filter(Boolean).join(" ") ||
  r.nombre_empleado ||
  r.nombre ||
  r.empleado_id ||
  "Sin nombre";
export const money = (value: unknown, currency = "PEN") =>
  value == null
    ? "—"
    : new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
        Number(value),
      );
export const number = (value: unknown) =>
  value == null ? "—" : new Intl.NumberFormat("es-PE").format(Number(value));
export function today(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}
export const month = () => today().slice(0, 7);
export function absenceMinDate(now = new Date()) {
  const d = new Date(today(now) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 15);
  return d.toISOString().slice(0, 10);
}
export function dateText(value: unknown) {
  if (!value) return "—";
  const text = String(value);
  const d = new Date(text.length === 10 ? text + "T12:00:00Z" : text);
  return isNaN(d.getTime())
    ? text
    : new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeZone: "America/Lima",
      }).format(d);
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
