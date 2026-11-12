import { useSearchParams } from "react-router";
import { EmployeePicker } from "../components/EmployeePicker";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { admin, supervisor } from "../lib/types";
import type { RecordData } from "../lib/types";
import { absenceMinDate, download, id, query, today } from "../lib/api";
import {
  Details,
  Editor,
  f,
  Head,
  Icon,
  Modal,
  Notice,
  Pager,
  Refresh,
  Resource,
  stateColumn,
  Table,
  Tabs,
  useAction,
  useResource,
} from "../components/ui";
export function Attendance() {
  const { api, user } = useAuth();
  const boss = supervisor(user);
  const [params] = useSearchParams();
  const [displayDate] = useState(() => new Date());
  const [tab, setTab] = useState("marcaciones");
  const [cursor, setCursor] = useState("");
  const [employee, setEmployee] = useState(
    boss ? params.get("empleado") || "" : user.empleado_id || "",
  );
  const [day, setDay] = useState(today());
  const [form, setForm] = useState("");
  const [resolve, setResolve] = useState<RecordData | null>(null);
  const [selected, setSelected] = useState<RecordData | null>(null);
  const action = useAction();
  const path =
    (tab === "pendientes" ? "/ausencias/pendientes" : "/" + tab) +
    query({
      limit: 30,
      next_token: cursor,
      empleado: employee,
      fecha: tab === "marcaciones" ? day : undefined,
    });
  const state = useResource(
    (s) =>
      !boss && !user.empleado_id
        ? Promise.resolve({ items: [] })
        : api("asistencia", path, { signal: s }),
    [api, path],
  );
  const balance = useResource(
    (s) =>
      user.empleado_id
        ? api("asistencia", "/ausencias/saldo/" + id(user.empleado_id), {
            signal: s,
          })
        : Promise.resolve(null),
    [api, user.empleado_id],
  );
  const summary = useResource(
    (s) =>
      boss
        ? api("asistencia", "/asistencia/resumen" + query({ fecha: day }), {
            signal: s,
          })
        : Promise.resolve(null),
    [api, boss, day],
  );
  const detail = useResource(
    (s) =>
      selected
        ? api(
            "asistencia",
            "/ausencias/" +
              id(selected.ausencia_id) +
              query({ empleado: selected.empleado_id }),
            { signal: s },
          )
        : Promise.resolve(null),
    [api, selected],
  );
  const refresh = () => {
    state.reload();
    balance.reload();
    summary.reload();
  };
  return (
    <>
      <Head
        title="Asistencia y ausencias"
        description="Gestiona jornadas, solicitudes y tiempo de descanso."
      >
        <Refresh onClick={refresh} />
        {(user.empleado_id || admin(user)) && (
          <button className="button primary" onClick={() => setForm("absence")}>
            <Icon name="plus" />
            Solicitar ausencia
          </button>
        )}
      </Head>
      {action.notice}
      <div className="attendance-top">
        <section className="panel padded">
          <span className="eyebrow">MI JORNADA · HORA DE LIMA</span>
          <h2>
            {new Intl.DateTimeFormat("es-PE", {
              dateStyle: "long",
              timeZone: "America/Lima",
            }).format(displayDate)}
          </h2>
          <div className="actions">
            {user.empleado_id &&
              ["ENTRADA", "SALIDA"].map((tipo) => (
                <button
                  key={tipo}
                  className={
                    "button " + (tipo === "ENTRADA" ? "primary" : "secondary")
                  }
                  disabled={action.busy}
                  onClick={() =>
                    action.run(async () => {
                      await api("asistencia", "/marcaciones", {
                        method: "POST",
                        body: { tipo },
                      });
                      refresh();
                    }, "Marcación registrada.")
                  }
                >
                  Marcar {tipo.toLowerCase()}
                </button>
              ))}
            {admin(user) && (
              <button className="text-button" onClick={() => setForm("mark")}>
                Registro manual
              </button>
            )}
          </div>
          {!user.empleado_id && (
            <Notice text="Tu cuenta no tiene empleado vinculado para registrar su propia jornada." />
          )}
        </section>
        <section className="panel padded">
          <span className="eyebrow">MIS VACACIONES</span>
          <Resource state={balance}>
            {balance.data ? (
              <>
                <strong className="big-number">
                  {balance.data.dias_disponibles}
                  <small> días</small>
                </strong>
                <p className="muted">
                  {balance.data.dias_usados} usados ·{" "}
                  {balance.data.dias_pendientes} pendientes ·{" "}
                  {balance.data.anio}
                </p>
              </>
            ) : (
              <p>Sin empleado vinculado.</p>
            )}
          </Resource>
        </section>
      </div>
      {boss && (
        <Resource state={summary}>
          {summary.data && (
            <div className="summary-strip">
              <span>
                <strong>{summary.data.marcaciones}</strong> marcaciones
              </span>
              <span>
                <strong>{summary.data.tardanzas}</strong> tardanzas
              </span>
              <span>
                <strong>{summary.data.abiertas}</strong> jornadas abiertas
              </span>
              <span>Fecha consultada: {day}</span>
            </div>
          )}
        </Resource>
      )}
      <section className="panel">
        <Tabs
          items={[
            ["marcaciones", "Marcaciones"],
            ["ausencias", "Ausencias"],
            ["pendientes", "Por aprobar"],
          ]}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setCursor("");
          }}
        />
        <div className="toolbar">
          {boss && (
            <label>
              Empleado
              <EmployeePicker
                value={employee}
                onChange={(value) => {
                  setEmployee(value);
                  setCursor("");
                }}
              />
            </label>
          )}
          {tab === "marcaciones" && (
            <label>
              Fecha
              <input
                type="date"
                required
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  setCursor("");
                }}
              />
            </label>
          )}
          {boss && tab === "marcaciones" && (
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() =>
                action.run(
                  async () =>
                    download(
                      await api<Blob>(
                        "asistencia",
                        "/asistencia/reportes" + query({ fecha: day }),
                        { format: "csv" },
                      ),
                      "asistencia-" + day + ".csv",
                    ),
                  "Reporte descargado.",
                )
              }
            >
              <Icon name="download" />
              Reporte diario CSV
            </button>
          )}
        </div>
        <Resource state={state} empty={!state.data?.items?.length}>
          <Table
            rows={state.data?.items || []}
            rowKey={tab === "marcaciones" ? "sk" : "ausencia_id"}
            columns={
              tab === "marcaciones"
                ? [
                    { key: "empleado_id", title: "Empleado" },
                    { key: "fecha", title: "Fecha" },
                    { key: "hora_entrada", title: "Entrada" },
                    { key: "hora_salida", title: "Salida" },
                    { key: "horas", title: "Horas" },
                    { key: "tardanza_minutos", title: "Tardanza (min)" },
                    stateColumn,
                  ]
                : [
                    {
                      key: "nombre_empleado",
                      title: "Empleado",
                      render: (r) => r.nombre_empleado || r.empleado_id,
                    },
                    { key: "tipo", title: "Tipo" },
                    { key: "desde", title: "Desde" },
                    { key: "hasta", title: "Hasta" },
                    stateColumn,
                  ]
            }
            actions={
              tab === "marcaciones"
                ? undefined
                : (r) => (
                    <>
                      <button
                        className="text-button"
                        onClick={() => setSelected(r)}
                      >
                        Detalle
                      </button>
                      {(r.estado === "PENDIENTE" ||
                        (r.estado === "APROBADA" &&
                          r.hasta < today() &&
                          r.empleado_id !== user.empleado_id)) &&
                        (admin(user) ||
                          r.aprobador_id === user.empleado_id ||
                          r.empleado_id === user.empleado_id) && (
                          <button
                            className="text-button"
                            onClick={() => setResolve(r)}
                          >
                            Gestionar
                          </button>
                        )}
                    </>
                  )
            }
          />
        </Resource>
        <Pager
          next={state.data?.next_token}
          cursor={cursor}
          onPage={setCursor}
          count={state.data?.items?.length}
        />
      </section>
      {form && (
        <Editor
          title={
            form === "absence"
              ? "Solicitar ausencia"
              : "Registrar marcación manual"
          }
          initial={{
            empleado_id: employee || user.empleado_id,
            fecha: today(),
          }}
          description={
            form === "absence"
              ? "La solicitud debe comenzar con al menos 15 días de anticipación y durar entre 1 y 90 días calendario."
              : "Solo RR. HH. puede indicar otra persona, fecha y hora."
          }
          fields={
            form === "absence"
              ? [
                  ...(admin(user) ? [f("empleado_id", "Empleado")] : []),
                  f("tipo", "Tipo", {
                    options: [
                      "VACACIONES",
                      "PERMISO",
                      "LICENCIA_MEDICA",
                      "SIN_GOCE",
                    ],
                  }),
                  f("desde", "Desde", { type: "date", min: absenceMinDate() }),
                  f("hasta", "Hasta", { type: "date", min: absenceMinDate() }),
                  f("motivo", "Motivo", { type: "textarea", maxLength: 500 }),
                ]
              : [
                  f("empleado_id", "Empleado"),
                  f("tipo", "Marcación", { options: ["ENTRADA", "SALIDA"] }),
                  f("fecha", "Fecha", { type: "date", max: today() }),
                  f("hora", "Hora de Lima", { type: "time" }),
                ]
          }
          onClose={() => setForm("")}
          onSave={async (body) => {
            if (form === "absence") {
              if (body.desde < absenceMinDate() || body.hasta < body.desde)
                throw Error(
                  "Revisa el rango de fechas y la anticipación mínima.",
                );
              if (
                (Date.parse(body.hasta) - Date.parse(body.desde)) / 86400000 +
                  1 >
                90
              )
                throw Error("La ausencia no puede superar 90 días.");
            }
            await api(
              "asistencia",
              form === "absence" ? "/ausencias" : "/marcaciones",
              { method: "POST", body },
            );
            refresh();
          }}
        />
      )}
      {resolve && (
        <Editor
          title="Gestionar ausencia"
          description={`${resolve.nombre_empleado || resolve.empleado_id} · ${resolve.tipo} · ${resolve.desde} a ${resolve.hasta}`}
          fields={[
            f("estado", "Decisión", {
              options:
                resolve.estado === "APROBADA"
                  ? (admin(user) ||
                      resolve.aprobador_id === user.empleado_id) &&
                    resolve.empleado_id !== user.empleado_id
                    ? ["FINALIZADA"]
                    : []
                  : [
                      ...((admin(user) ||
                        resolve.aprobador_id === user.empleado_id) &&
                      resolve.empleado_id !== user.empleado_id
                        ? ["APROBADA", "RECHAZADA"]
                        : []),
                      ...(admin(user) ||
                      resolve.empleado_id === user.empleado_id
                        ? ["CANCELADA"]
                        : []),
                    ],
            }),
            f("comentario", "Comentario", {
              required: false,
              type: "textarea",
              maxLength: 500,
            }),
          ]}
          onClose={() => setResolve(null)}
          onSave={async (body) => {
            await api(
              "asistencia",
              "/ausencias/" + id(resolve.ausencia_id) + "/estado",
              {
                method: "PATCH",
                body: { ...body, empleado_id: resolve.empleado_id },
              },
            );
            refresh();
          }}
        />
      )}
      {selected && (
        <Modal title="Detalle de ausencia" onClose={() => setSelected(null)}>
          <Resource state={detail}>
            {detail.data && (
              <Details
                record={detail.data}
                fields={[
                  ["nombre_empleado", "Empleado"],
                  ["tipo", "Tipo"],
                  ["estado", "Estado"],
                  ["desde", "Desde"],
                  ["hasta", "Hasta"],
                  ["dias", "Días"],
                  ["motivo", "Motivo"],
                  ["aprobador_id", "Aprobador"],
                  ["comentario", "Respuesta"],
                ]}
              />
            )}
          </Resource>
        </Modal>
      )}
    </>
  );
}
