import { Link, useSearchParams } from "react-router";
import { EmployeePicker } from "../components/EmployeePicker";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { admin, supervisor, roleLabel } from "../lib/types";
import type {
  RecordData,
  Employee,
  PageData,
  OnboardingTask,
} from "../lib/types";
import { fullName, id, query, today } from "../lib/api";
import {
  Badge,
  Details,
  Editor,
  Empty,
  f,
  Head,
  Icon,
  Modal,
  Notice,
  Pager,
  personColumn,
  Refresh,
  Resource,
  stateColumn,
  Table,
  useResource,
} from "../components/ui";
const employeeFields = [
  f("nombres", "Nombres"),
  f("apellidos", "Apellidos"),
  f("email", "Correo electrónico", { type: "email" }),
  f("documento", "Documento", {
    pattern: "[0-9]{8}",
    minLength: 8,
    maxLength: 8,
    hint: "Exactamente 8 dígitos.",
  }),
  f("area", "Área"),
  f("cargo", "Cargo"),
  f("fecha_ingreso", "Fecha de ingreso", { type: "date" }),
  f("salario_base", "Salario mensual (PEN)", {
    type: "number",
    min: 0.01,
    max: 1000000,
    step: 0.01,
  }),
  f("jefe_id", "Jefe directo", { required: false }),
  f("telefono", "Teléfono", { required: false, maxLength: 30 }),
  f("direccion", "Dirección", { required: false }),
  f("contacto_emergencia", "Contacto de emergencia", { required: false }),
];
const detailFields: [string, string][] = [
  ["empleado_id", "Código"],
  ["email", "Correo"],
  ["documento", "Documento"],
  ["area", "Área"],
  ["cargo", "Cargo"],
  ["jefe_id", "Jefe"],
  ["fecha_ingreso", "Ingreso"],
  ["salario_base", "Salario mensual (PEN)"],
  ["telefono", "Teléfono"],
  ["direccion", "Dirección"],
  ["contacto_emergencia", "Contacto de emergencia"],
  ["fecha_cese", "Fecha de cese"],
];
export function Employees() {
  const { api, user } = useAuth();
  const [cursor, setCursor] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [edit, setEdit] = useState<RecordData | null>(null);
  const [change, setChange] = useState<RecordData | null>(null);
  const [message, setMessage] = useState("");
  const list = useResource(
    (s) =>
      api<PageData<Employee>>(
        "empleados",
        "/empleados" +
          query({ limit: 30, next_token: cursor, area, estado: status }),
        { signal: s },
      ),
    [api, cursor, area, status],
  );
  const profile = useResource(
    (s) =>
      selected
        ? api<Employee>("empleados", "/empleados/" + id(selected), {
            signal: s,
          })
        : Promise.resolve(null),
    [api, selected],
  );
  const rows = (list.data?.items || []).filter((r: RecordData) =>
    [fullName(r), r.email, r.cargo, r.empleado_id]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Head
        title="Personas"
        description="Un directorio conectado con cada etapa de tu equipo."
      >
        <Refresh onClick={list.reload} />
        {admin(user) && (
          <button className="button primary" onClick={() => setEdit({})}>
            <Icon name="plus" />
            Nuevo empleado
          </button>
        )}
      </Head>
      <Notice text={message} />
      <section className="panel">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <input
              aria-label="Buscar en la página actual"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en esta página…"
            />
          </label>
          <label>
            Área
            <input
              value={area}
              placeholder="Todas las áreas"
              onChange={(e) => {
                setArea(e.target.value);
                setCursor("");
              }}
            />
          </label>
          <label>
            Estado
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCursor("");
              }}
            >
              <option value="">Todos</option>
              {["ACTIVO", "VACACIONES", "CESADO"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        {(area || status || search) && (
          <div className="active-filters">
            <span>
              Filtros activos:{" "}
              {[
                area && "Área: " + area,
                status && "Estado: " + status,
                search && "Búsqueda: " + search,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <button
              className="text-button"
              onClick={() => {
                setArea("");
                setStatus("");
                setSearch("");
                setCursor("");
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
        <Resource state={list} empty={!rows.length}>
          <Table
            rows={rows}
            rowKey="empleado_id"
            columns={[
              personColumn,
              { key: "area", title: "Área" },
              { key: "cargo", title: "Cargo" },
              stateColumn,
            ]}
            actions={(r) => (
              <button
                className="text-button"
                onClick={() => setSelected(r.empleado_id)}
              >
                Ver ficha →
              </button>
            )}
          />
        </Resource>
        <Pager
          next={list.data?.next_token ?? undefined}
          cursor={cursor}
          onPage={setCursor}
          count={rows.length}
        />
      </section>
      {selected && (
        <Modal title="Ficha del empleado" onClose={() => setSelected("")}>
          <Resource state={profile}>
            {profile.data && (
              <>
                <div className="profile-title">
                  <h3>{fullName(profile.data)}</h3>
                  <Badge value={profile.data.estado} />
                </div>
                <Details
                  record={profile.data}
                  fields={detailFields.filter(([k]) => k in profile.data!)}
                />
                <nav
                  className="employee-links"
                  aria-label="Gestión del empleado"
                >
                  {[
                    ["nominas", "Nóminas"],
                    ["asistencia", "Asistencia"],
                    ["desempeno", "Desempeño"],
                    ["onboarding", "Incorporación"],
                  ].map(([path, title]) => (
                    <Link
                      className="button secondary"
                      key={path}
                      to={
                        "/" +
                        path +
                        "?empleado=" +
                        id(profile.data!.empleado_id)
                      }
                    >
                      {title}
                    </Link>
                  ))}
                </nav>
                {admin(user) && profile.data.estado !== "CESADO" && (
                  <footer>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setChange(profile.data);
                        setSelected("");
                      }}
                    >
                      Cambiar estado
                    </button>
                    <button
                      className="button primary"
                      onClick={() => {
                        setEdit(profile.data);
                        setSelected("");
                      }}
                    >
                      Editar ficha
                    </button>
                  </footer>
                )}
              </>
            )}
          </Resource>
        </Modal>
      )}
      {edit && (
        <Editor
          title={edit.empleado_id ? "Editar empleado" : "Nuevo empleado"}
          fields={employeeFields}
          initial={edit}
          onClose={() => setEdit(null)}
          onSave={async (body) => {
            if (edit.empleado_id && !body.jefe_id && edit.jefe_id)
              body.jefe_id = null;
            const result = await api(
              "empleados",
              edit.empleado_id
                ? "/empleados/" + id(edit.empleado_id)
                : "/empleados",
              { method: edit.empleado_id ? "PUT" : "POST", body },
            );
            setMessage(result.aviso || "Ficha guardada correctamente.");
            list.reload();
          }}
        />
      )}
      {change && (
        <Editor
          title={"Estado de " + fullName(change)}
          description="El cese desactiva la cuenta y activa el procesamiento de liquidación. No puede revertirse desde la API."
          initial={{ fecha_cese: today() }}
          fields={[
            f("estado", "Nuevo estado", {
              options: (change.estado === "VACACIONES"
                ? ["ACTIVO", "CESADO"]
                : ["VACACIONES", "CESADO"]
              ).filter(
                (v) =>
                  v !== "CESADO" || change.empleado_id !== user.empleado_id,
              ),
            }),
            f("fecha_cese", "Fecha de cese (solo si corresponde)", {
              type: "date",
              required: false,
              min: change.fecha_ingreso,
            }),
            f("motivo", "Motivo", {
              type: "textarea",
              required: false,
              maxLength: 200,
            }),
          ]}
          onClose={() => setChange(null)}
          onSave={async (body) => {
            if (body.estado === "CESADO" && !body.fecha_cese)
              throw Error("Indica la fecha de cese.");
            if (
              body.estado === "CESADO" &&
              !window.confirm(
                "¿Confirmas el cese definitivo de " +
                  fullName(change) +
                  " desde " +
                  body.fecha_cese +
                  "? Se desactivará su cuenta y se solicitará su liquidación. Esta acción no se puede revertir desde Mimo.",
              )
            )
              throw Error("Operación cancelada.");
            const r = await api(
              "empleados",
              "/empleados/" + id(change.empleado_id) + "/estado",
              { method: "PATCH", body },
            );
            setMessage(r.aviso || "Estado actualizado.");
            list.reload();
          }}
        />
      )}
    </>
  );
}
export function Organization() {
  const { api } = useAuth();
  const [mode, setMode] = useState("area");
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [cursor, setCursor] = useState("");
  const state = useResource(
    (s) =>
      filter
        ? api(
            "empleados",
            "/empleados/organigrama" +
              query({ [mode]: filter, limit: 50, next_token: cursor }),
            { signal: s },
          )
        : Promise.resolve(null),
    [api, mode, filter, cursor],
  );
  const groups =
    state.data?.grupos ||
    (state.data?.subordinados
      ? [
          {
            jefe_id: state.data.jefe?.empleado_id,
            empleados: state.data.subordinados,
          },
        ]
      : []);
  return (
    <>
      <Head
        title="Organización"
        description="Explora la estructura del equipo por área o jefe directo."
      />
      <section className="panel">
        <form
          className="toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter(draft.trim());
            setCursor("");
          }}
        >
          <label>
            Consultar por
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setFilter("");
                setDraft("");
                setCursor("");
              }}
            >
              <option value="area">Área</option>
              <option value="jefe_id">Código del jefe</option>
            </select>
          </label>
          <label>
            {mode === "area" ? "Nombre del área" : "Jefe directo"}
            {mode === "area" ? (
              <input
                required
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            ) : (
              <EmployeePicker
                label="Jefe directo"
                value={draft}
                onChange={setDraft}
                required
              />
            )}
          </label>
          <button className="button primary">Consultar</button>
        </form>
        {!filter ? (
          <Empty text="Indica un área o un jefe para consultar su estructura." />
        ) : (
          <Resource state={state} empty={!groups.length}>
            {state.data?.jefe && (
              <div className="organization-lead">
                <Icon name="tree" />
                <strong>{fullName(state.data.jefe)}</strong>
                <span>{state.data.jefe.cargo}</span>
              </div>
            )}
            {groups.map((g: RecordData, i: number) => (
              <div className="organization-group" key={g.jefe_id || i}>
                <h3>
                  {g.jefe_id ? "Equipo de " + g.jefe_id : "Sin jefe asignado"}
                </h3>
                <Table
                  rows={g.empleados}
                  columns={[
                    personColumn,
                    { key: "cargo", title: "Cargo" },
                    stateColumn,
                  ]}
                  rowKey="empleado_id"
                />
              </div>
            ))}
          </Resource>
        )}
        <Pager
          next={state.data?.next_token}
          cursor={cursor}
          onPage={setCursor}
          count={groups.reduce(
            (n: number, g: RecordData) => n + g.empleados.length,
            0,
          )}
        />
      </section>
    </>
  );
}
export function Users() {
  const { api, user } = useAuth();
  const [cursor, setCursor] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [edit, setEdit] = useState<RecordData | null>(null);
  const [selected, setSelected] = useState("");
  const state = useResource(
    (s) =>
      api(
        "usuarios",
        "/usuarios" +
          query({ limit: 30, next_token: cursor, rol: role, activo: active }),
        { signal: s },
      ),
    [api, cursor, role, active],
  );
  const detail = useResource(
    (s) =>
      selected
        ? api("usuarios", "/usuarios/" + id(selected), { signal: s })
        : Promise.resolve(null),
    [api, selected],
  );
  return (
    <>
      <Head
        title="Usuarios y accesos"
        description="Administra quién puede trabajar en el espacio de tu empresa."
      >
        <button className="button primary" onClick={() => setEdit({})}>
          <Icon name="plus" />
          Nuevo usuario
        </button>
      </Head>
      <section className="panel">
        <div className="toolbar">
          <label>
            Rol
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setCursor("");
              }}
            >
              <option value="">Todos</option>
              {Object.entries(roleLabel).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              value={active}
              onChange={(e) => {
                setActive(e.target.value);
                setCursor("");
              }}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
          <Refresh onClick={state.reload} />
        </div>
        <Resource state={state} empty={!state.data?.items?.length}>
          <Table
            rows={state.data?.items || []}
            rowKey="user_id"
            columns={[
              personColumn,
              {
                key: "rol",
                title: "Rol",
                render: (r) =>
                  roleLabel[r.rol as keyof typeof roleLabel] || r.rol,
              },
              {
                key: "activo",
                title: "Estado",
                render: (r) => <Badge value={r.activo} />,
              },
            ]}
            actions={(r) => (
              <>
                <button
                  className="text-button"
                  onClick={() => setSelected(r.user_id)}
                >
                  Detalle
                </button>
                <button className="text-button" onClick={() => setEdit(r)}>
                  Editar
                </button>
              </>
            )}
          />
        </Resource>
        <Pager
          next={state.data?.next_token}
          cursor={cursor}
          onPage={setCursor}
          count={state.data?.items?.length}
        />
      </section>
      {selected && (
        <Modal title="Usuario" onClose={() => setSelected("")}>
          <Resource state={detail}>
            {detail.data && (
              <Details
                record={detail.data}
                fields={[
                  ["user_id", "Código"],
                  ["nombre", "Nombre"],
                  ["email", "Correo"],
                  ["rol", "Rol"],
                  ["empleado_id", "Empleado vinculado"],
                  ["activo", "Activo"],
                  ["debe_cambiar_password", "Cambio de contraseña pendiente"],
                ]}
              />
            )}
          </Resource>
        </Modal>
      )}
      {edit && (
        <Editor
          title={edit.user_id ? "Editar usuario" : "Crear usuario"}
          initial={edit}
          fields={
            edit.user_id
              ? [
                  f("nombre", "Nombre"),
                  ...(edit.user_id === user.user_id
                    ? []
                    : [
                        f("rol", "Rol", { options: Object.entries(roleLabel) }),
                        f("activo", "Cuenta activa", { type: "checkbox" }),
                      ]),
                ]
              : [
                  f("nombre", "Nombre"),
                  f("email", "Correo", { type: "email" }),
                  f("rol", "Rol", { options: Object.entries(roleLabel) }),
                  f("password", "Contraseña inicial", {
                    type: "password",
                    minLength: 8,
                  }),
                  f("empleado_id", "Empleado", { required: false }),
                ]
          }
          onClose={() => setEdit(null)}
          onSave={async (body) => {
            await api(
              "usuarios",
              edit.user_id ? "/usuarios/" + id(edit.user_id) : "/usuarios",
              { method: edit.user_id ? "PATCH" : "POST", body },
            );
            state.reload();
          }}
        />
      )}
    </>
  );
}
export function Profile() {
  const { api, user, passwordChanged } = useAuth();
  const [edit, setEdit] = useState("");
  const me = useResource(
    (s) => api("usuarios", "/usuarios/me", { signal: s }),
    [api],
  );
  const profile = useResource(
    (s) =>
      user.empleado_id
        ? api("empleados", "/empleados/me", { signal: s })
        : Promise.resolve(null),
    [api, user.empleado_id],
  );
  return (
    <>
      <Head
        title="Mi perfil"
        description="Tu información personal y la seguridad de tu cuenta."
      >
        <button
          className="button secondary"
          onClick={() => setEdit("password")}
        >
          Cambiar contraseña
        </button>
      </Head>
      <section className="panel padded">
        <Resource state={me}>
          {me.data && (
            <>
              <div className="profile-title">
                <h2>{me.data.nombre}</h2>
                <Badge value={me.data.rol} />
              </div>
              <Details
                record={me.data}
                fields={[
                  ["email", "Correo"],
                  ["tenant_id", "Empresa"],
                  ["empleado_id", "Código de empleado"],
                ]}
              />
            </>
          )}
        </Resource>
      </section>
      <section className="panel padded">
        <div className="section-heading">
          <h2>Información del empleado</h2>
          {profile.data && (
            <button
              className="button secondary"
              onClick={() => setEdit("contact")}
            >
              Editar contacto
            </button>
          )}
        </div>
        {!user.empleado_id ? (
          <Notice text="Tu cuenta no está vinculada a una ficha de empleado. Las funciones personales requieren esa vinculación." />
        ) : (
          <Resource state={profile}>
            {profile.data && (
              <Details record={profile.data} fields={detailFields} />
            )}
          </Resource>
        )}
      </section>
      {edit && (
        <Editor
          title={edit === "password" ? "Cambiar contraseña" : "Editar contacto"}
          initial={edit === "contact" ? profile.data || {} : {}}
          fields={
            edit === "password"
              ? [
                  f("password_actual", "Contraseña actual", {
                    type: "password",
                    minLength: 8,
                  }),
                  f("password_nueva", "Nueva contraseña", {
                    type: "password",
                    minLength: 8,
                  }),
                ]
              : [
                  f("telefono", "Teléfono", { required: false }),
                  f("direccion", "Dirección", { required: false }),
                  f("contacto_emergencia", "Contacto de emergencia", {
                    required: false,
                  }),
                ]
          }
          onClose={() => setEdit("")}
          onSave={async (body) => {
            if (edit === "password") {
              if (body.password_actual === body.password_nueva)
                throw Error("La nueva contraseña debe ser diferente.");
              await api("usuarios", "/auth/cambiar-password", {
                method: "POST",
                body,
              });
              passwordChanged();
            } else {
              if (!Object.keys(body).length)
                throw Error("Completa al menos un dato de contacto.");
              await api("empleados", "/empleados/me", {
                method: "PATCH",
                body,
              });
              profile.reload();
            }
          }}
        />
      )}
    </>
  );
}
export function Onboarding() {
  const { api, user } = useAuth();
  const [params] = useSearchParams();
  const [employee, setEmployee] = useState(
    (supervisor(user) || user.rol === "reclutador"
      ? params.get("empleado")
      : null) ||
      user.empleado_id ||
      "",
  );
  const [draft, setDraft] = useState(employee);
  const [create, setCreate] = useState(false);
  const [task, setTask] = useState<RecordData | null>(null);
  const state = useResource(
    (s) =>
      employee
        ? api<OnboardingTask[]>(
            "reclutamiento",
            "/onboarding/" + id(employee),
            { signal: s },
          )
        : Promise.resolve([]),
    [api, employee],
  );
  return (
    <>
      <Head
        title="Onboarding"
        description="Acompaña los primeros pasos de cada incorporación."
      >
        {(admin(user) || user.rol === "reclutador") && (
          <button className="button primary" onClick={() => setCreate(true)}>
            <Icon name="plus" />
            Nueva tarea
          </button>
        )}
      </Head>
      <section className="panel">
        {(supervisor(user) || user.rol === "reclutador") && (
          <form
            className="toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              setEmployee(draft.trim());
            }}
          >
            <label>
              Empleado
              <EmployeePicker value={draft} onChange={setDraft} required />
            </label>
            <button className="button secondary">Consultar</button>
          </form>
        )}
        <Resource state={state} empty={!state.data?.length}>
          <Table
            rows={state.data || []}
            rowKey="onboarding_id"
            columns={[
              { key: "tarea", title: "Tarea" },
              { key: "empleado_id", title: "Empleado" },
              {
                key: "completada",
                title: "Estado",
                render: (r) => (
                  <Badge value={r.completada ? "COMPLETADA" : "PENDIENTE"} />
                ),
              },
            ]}
            actions={(r) =>
              !r.completada && (
                <button className="text-button" onClick={() => setTask(r)}>
                  Completar
                </button>
              )
            }
          />
        </Resource>
      </section>
      {create && (
        <Editor
          title="Nueva tarea de incorporación"
          initial={{ empleado_id: employee }}
          fields={[
            f("empleado_id", "Empleado"),
            f("tarea", "Tarea", { type: "textarea" }),
          ]}
          onClose={() => setCreate(false)}
          onSave={async (body) => {
            await api("reclutamiento", "/onboarding", { method: "POST", body });
            setEmployee(body.empleado_id);
            setDraft(body.empleado_id);
            state.reload();
          }}
        />
      )}
      {task && (
        <Editor
          title="Completar tarea"
          description={task.tarea}
          fields={[]}
          submit="Confirmar finalización"
          onClose={() => setTask(null)}
          onSave={async () => {
            await api(
              "reclutamiento",
              "/onboarding/" + id(employee) + "/" + id(task.onboarding_id),
              { method: "PATCH", body: {} },
            );
            state.reload();
          }}
        />
      )}
    </>
  );
}
