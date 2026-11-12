import { useEffect, useId, useState } from "react";
import { useAuth } from "../lib/auth";
import { fullName, query } from "../lib/api";
import { supervisor } from "../lib/types";
import type { Employee, PageData } from "../lib/types";

/** Queries only the current authenticated tenant. Search is explicit about its page scope. */
export function EmployeePicker({
  name,
  value,
  onChange,
  required = false,
  readOnly = false,
  label = "Empleado",
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  readOnly?: boolean;
  label?: string;
}) {
  const { api, user } = useAuth();
  const hintId = useId();
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState("");
  const [rows, setRows] = useState<Employee[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const canList = supervisor(user);
  useEffect(() => {
    if (!canList || readOnly) return;
    const controller = new AbortController();
    // This effect synchronizes a cancellable remote directory query.
    // eslint-disable-next-line react/set-state-in-effect
    setBusy(true);
    setError("");
    api<PageData<Employee>>(
      "empleados",
      "/empleados" + query({ limit: 50, next_token: cursor }),
      { signal: controller.signal },
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setRows((previous) =>
          Array.from(
            new Map(
              [...(!cursor ? [] : previous), ...data.items].map((person) => [
                person.empleado_id,
                person,
              ]),
            ).values(),
          ),
        );
        setNext(
          data.next_token && data.next_token !== cursor
            ? data.next_token
            : null,
        );
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo consultar el directorio.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [api, cursor, retry, canList, readOnly]);
  if (!canList || readOnly)
    return (
      <span className="employee-picker">
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          readOnly={readOnly}
          aria-label={label}
          aria-describedby={hintId}
        />
        <small id={hintId}>
          {readOnly
            ? "Persona vinculada al registro."
            : "Tu rol no puede consultar el directorio. Usa el código proporcionado por RR. HH."}
        </small>
      </span>
    );
  const term = search.trim().toLocaleLowerCase("es");
  const matches = rows.filter(
    (person) =>
      person.empleado_id === value ||
      [fullName(person), person.area, person.email, person.empleado_id]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(term),
  );
  return (
    <span className="employee-picker">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, área o correo"
        aria-label={"Buscar " + label.toLocaleLowerCase("es")}
        aria-describedby={hintId}
      />
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-label={label}
        aria-busy={busy}
      >
        <option value="">
          {required ? "Selecciona una persona" : "Sin selección"}
        </option>
        {value && !rows.some((person) => person.empleado_id === value) && (
          <option value={value}>Persona seleccionada · {value}</option>
        )}
        {matches.map((person) => (
          <option key={person.empleado_id} value={person.empleado_id}>
            {fullName(person)} · {person.area || "Sin área"} ·{" "}
            {person.empleado_id}
          </option>
        ))}
      </select>
      <small id={hintId}>
        {busy
          ? "Cargando personas…"
          : `${rows.length} personas cargadas. La búsqueda filtra las personas cargadas.`}
      </small>
      {!busy && !error && !matches.length && (
        <small role="status">
          Sin coincidencias.
          {next ? " Carga más personas para ampliar la búsqueda." : ""}
        </small>
      )}
      {error && (
        <span className="picker-error" role="alert">
          {error}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => setRetry((v) => v + 1)}
          >
            Reintentar directorio
          </button>
        </span>
      )}
      {next && !error && (
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => setCursor(next)}
        >
          Cargar más personas
        </button>
      )}
    </span>
  );
}
