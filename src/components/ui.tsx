/* eslint-disable react/only-export-components -- Shared UI primitives and their typed helpers intentionally share this module. */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { DependencyList, ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { supervisor } from "../lib/types";
import { dateText, fullName, label } from "../lib/api";
import type { RecordData } from "../lib/types";
export function Icon({
  name = "grid",
  size = 20,
}: {
  name?: string;
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M3 9h18m-6 4h6v4h-6z" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V4h8v3M3 12a22 22 0 0 0 18 0M12 12v4" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    logout: (
      <>
        <path d="M10 3H4v18h6M9 12h12m-4-4 4 4-4 4" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    tree: (
      <>
        <rect x="9" y="2" width="6" height="5" rx="1" />
        <path d="M12 7v5M4 16v-4h16v4" />
        <rect x="1" y="16" width="6" height="5" rx="1" />
        <rect x="17" y="16" width="6" height="5" rx="1" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">m</span>mimo
      <span className="brand-dot">.</span>
    </span>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar">
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function Person({ row }: { row: RecordData }) {
  return (
    <div className="person">
      <Avatar name={fullName(row)} />
      <span>
        <strong>{fullName(row)}</strong>
        <small>{row.email || row.empleado_id}</small>
      </span>
    </div>
  );
}
export function Badge({ value }: { value: unknown }) {
  const v = String(value);
  return (
    <span
      className={
        "badge " +
        ([
          "ACTIVO",
          "APROBADA",
          "COMPLETADA",
          "CONTRATADO",
          "GENERADA",
          "true",
        ].includes(v)
          ? "green"
          : ["CESADO", "RECHAZADA", "FALLIDA", "false"].includes(v)
            ? "red"
            : ["PENDIENTE", "EN_PROCESO", "EN_PROGRESO", "VACACIONES"].includes(
                  v,
                )
              ? "amber"
              : "")
      }
    >
      {v === "true" ? "Activo" : v === "false" ? "Inactivo" : label(value)}
    </span>
  );
}
export function Head({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text?: string | null;
  error?: boolean;
}) {
  return text ? (
    <div
      className={"notice " + (error ? "error" : "")}
      role={error ? "alert" : "status"}
    >
      {text}
    </div>
  ) : null;
}
export function Empty({
  text = "No hay registros en esta página o consulta.",
}: {
  text?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="search" size={26} />
      </span>
      <h3>Todo despejado</h3>
      <p>{text}</p>
    </div>
  );
}
export function useResource<T = any>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string;
  }>({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  // This query hook synchronizes with an external API; callers supply its request dependencies.
  /* eslint-disable react-hooks/exhaustive-deps, react/set-state-in-effect -- Dependencies are deliberately supplied by callers of this API query hook. */
  useEffect(() => {
    const c = new AbortController();
    setState({ data: null, loading: true, error: "" });
    load(c.signal)
      .then((data) => {
        if (!c.signal.aborted) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (!c.signal.aborted)
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Error de consulta",
          });
      });
    return () => c.abort();
  }, [...deps, version]);
  /* eslint-enable react-hooks/exhaustive-deps, react/set-state-in-effect */
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
export function Resource({
  state,
  children,
  empty = false,
}: {
  state: { loading: boolean; error: string; reload: () => void };
  children: ReactNode;
  empty?: boolean;
}) {
  return state.loading ? (
    <div className="skeleton-block" role="status" aria-label="Cargando datos">
      <span />
      <span />
      <span />
    </div>
  ) : state.error ? (
    <div className="error-state">
      <Notice text={state.error} error />
      <button className="button secondary" onClick={state.reload}>
        <Icon name="refresh" />
        Reintentar
      </button>
    </div>
  ) : empty ? (
    <Empty />
  ) : (
    <>{children}</>
  );
}
export function Refresh({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="button secondary icon-only"
      title="Actualizar"
      aria-label="Actualizar datos"
      onClick={onClick}
    >
      <Icon name="refresh" />
    </button>
  );
}
export interface Column {
  key: string;
  title: string;
  render?: (row: RecordData) => ReactNode;
}
export function Table({
  rows,
  columns,
  actions,
  rowKey = "id",
}: {
  rows: RecordData[];
  columns: Column[];
  actions?: (row: RecordData) => ReactNode;
  rowKey?: string;
}) {
  return (
    <div className="table-wrap" tabIndex={0} aria-label="Tabla de resultados">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.title}
              </th>
            ))}
            {actions && <th scope="col">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[rowKey] || i}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                </td>
              ))}
              {actions && (
                <td>
                  <div className="row-actions">{actions(r)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export const stateColumn: Column = {
  key: "estado",
  title: "Estado",
  render: (r) => <Badge value={r.estado} />,
};
export const personColumn: Column = {
  key: "persona",
  title: "Persona",
  render: (r) => <Person row={r} />,
};
export function Pager({
  next,
  cursor,
  onPage,
  count,
}: {
  next?: string;
  cursor?: string;
  onPage: (v: string) => void;
  count?: number;
}) {
  return (
    <div className="pagination">
      <span>{count ?? 0} registros en esta página</span>
      <div className="actions">
        {cursor && (
          <button className="button secondary small" onClick={() => onPage("")}>
            Primera página
          </button>
        )}
        {next && (
          <button
            className="button secondary small"
            onClick={() => onPage(next)}
          >
            Siguiente
            <Icon name="arrow" size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="tabs" aria-label="Secciones">
      {items.map(([k, t]) => (
        <button
          key={k}
          aria-pressed={value === k}
          className={value === k ? "active" : ""}
          onClick={() => onChange(k)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          className="button secondary icon-only"
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar"
        >
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[] | [string, string][];
  min?: number | string;
  max?: number | string;
  step?: number;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  hint?: string;
  readOnly?: boolean;
}
export const f = (
  name: string,
  label: string,
  extra: Partial<Field> = {},
): Field => ({ name, label, required: true, ...extra });
function EmployeeInput({
  field,
  initial,
}: {
  field: Field;
  initial: RecordData;
}) {
  const { api, user } = useAuth();
  const listId = useId();
  const people = useResource(
    (s) =>
      supervisor(user)
        ? api("empleados", "/empleados?limit=50", { signal: s })
        : Promise.resolve(null),
    [api, user.rol],
  );
  return (
    <>
      <input
        name={field.name}
        list={listId}
        defaultValue={initial[field.name] ?? ""}
        required={field.required}
        placeholder="Selecciona una persona o escribe su código"
        autoComplete="off"
        readOnly={field.readOnly}
      />
      <datalist id={listId}>
        {people.data?.items?.map((r: RecordData) => (
          <option key={r.empleado_id} value={r.empleado_id}>
            {fullName(r)} · {r.area}
          </option>
        ))}
      </datalist>
      <small>
        {supervisor(user)
          ? "Sugerencias: primeras 50 personas. También puedes ingresar otro código del directorio."
          : "Ingresa el código de la ficha del empleado."}
      </small>
    </>
  );
}
export function Editor({
  title,
  fields,
  initial = {},
  onSave,
  onClose,
  description,
  submit = "Guardar cambios",
}: {
  title: string;
  fields: Field[];
  initial?: RecordData;
  onSave: (data: RecordData) => Promise<unknown>;
  onClose: () => void;
  description?: string;
  submit?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const raw = new FormData(e.currentTarget);
          const data: RecordData = {};
          try {
            for (const field of fields) {
              const v = raw.get(field.name);
              if (field.type === "checkbox") {
                data[field.name] = v === "on";
                continue;
              }
              if (
                v === "" &&
                !field.required &&
                field.type !== "lines" &&
                field.type !== "textarea"
              )
                continue;
              data[field.name] =
                field.type === "number"
                  ? Number(v)
                  : field.type === "lines"
                    ? String(v ?? "")
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : typeof v === "string" && field.type !== "password"
                      ? v.trim()
                      : v;
            }
            setBusy(true);
            setError("");
            await onSave(data);
            onClose();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "No se pudo guardar.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {description && <p className="form-description">{description}</p>}
        <fieldset disabled={busy} className="form-grid">
          {fields.map((field) => (
            <label
              className={
                ["textarea", "lines", "checkbox"].includes(field.type || "")
                  ? "wide"
                  : ""
              }
              key={field.name}
            >
              <span>
                {field.label}
                {field.required && <span className="required"> *</span>}
              </span>
              {[
                "empleado_id",
                "jefe_id",
                "evaluador_id",
                "para_empleado_id",
              ].includes(field.name) ? (
                <EmployeeInput field={field} initial={initial} />
              ) : field.options ? (
                <select
                  name={field.name}
                  defaultValue={initial[field.name] ?? ""}
                  required={field.required}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  {field.options.map((o) => {
                    const [v, t] = Array.isArray(o) ? o : [o, label(o)];
                    return (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    );
                  })}
                </select>
              ) : field.type === "textarea" || field.type === "lines" ? (
                <textarea
                  name={field.name}
                  rows={4}
                  defaultValue={
                    Array.isArray(initial[field.name])
                      ? initial[field.name].join("\n")
                      : (initial[field.name] ?? "")
                  }
                  required={field.required}
                  maxLength={field.maxLength}
                />
              ) : field.type === "checkbox" ? (
                <input
                  name={field.name}
                  type="checkbox"
                  defaultChecked={Boolean(initial[field.name])}
                />
              ) : (
                <input
                  name={field.name}
                  type={field.type || "text"}
                  defaultValue={initial[field.name] ?? ""}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  pattern={field.pattern}
                  placeholder={field.placeholder}
                  readOnly={field.readOnly}
                  autoComplete={
                    field.type === "password" ? "new-password" : "off"
                  }
                />
              )}{" "}
              {field.hint && <small>{field.hint}</small>}
            </label>
          ))}
        </fieldset>
        <Notice text={error} error />
        <footer>
          <button
            className="button secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Guardando…" : submit}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function Details({
  record,
  fields,
}: {
  record: RecordData;
  fields: [string, string][];
}) {
  return (
    <dl className="details">
      {fields.map(([k, t]) => (
        <div key={k}>
          <dt>{t}</dt>
          <dd>
            {record[k] == null
              ? "—"
              : typeof record[k] === "object"
                ? JSON.stringify(record[k])
                : k.includes("fecha")
                  ? dateText(record[k])
                  : String(record[k])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const lock = useRef(false);
  async function run(
    task: () => Promise<unknown>,
    success = "Operación completada.",
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const r = (await task()) as RecordData;
      setError(false);
      setMessage(r?.aviso || success);
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "No se pudo completar.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return { busy, run, notice: <Notice text={message} error={error} /> };
}
