import { useState } from "react";
import { useAuth } from "../lib/auth";
import { supervisor } from "../lib/types";
import type { RecordData } from "../lib/types";
import { dateText, id, label, month, query } from "../lib/api";
import {
  Badge,
  Editor,
  Empty,
  f,
  Head,
  Icon,
  Modal,
  Notice,
  Refresh,
  Resource,
  stateColumn,
  Table,
  useAction,
  useResource,
} from "../components/ui";
export function Recruiting() {
  const { api } = useAuth();
  const [vacancy, setVacancy] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState("");
  const [candidate, setCandidate] = useState<RecordData | null>(null);
  const [upload, setUpload] = useState<RecordData | null>(null);
  const [message, setMessage] = useState("");
  const jobs = useResource(
    (s) => api("reclutamiento", "/vacantes", { signal: s }),
    [api],
  );
  const people = useResource(
    (s) =>
      vacancy
        ? api("reclutamiento", "/vacantes/" + id(vacancy) + "/postulaciones", {
            signal: s,
          })
        : Promise.resolve([]),
    [api, vacancy],
  );
  const rows = (Array.isArray(jobs.data) ? jobs.data : []).filter(
    (r: RecordData) =>
      (r.titulo + " " + r.area).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <Head
        title="Reclutamiento"
        description="Conecta las oportunidades de tu empresa con su próximo talento."
      >
        <Refresh
          onClick={() => {
            jobs.reload();
            people.reload();
          }}
        />
        <button className="button primary" onClick={() => setForm("job")}>
          <Icon name="plus" />
          Nueva vacante
        </button>
      </Head>
      <Notice text={message} />
      <div className="recruiting-layout">
        <section className="panel jobs-panel">
          <div className="toolbar">
            <label className="search">
              <Icon name="search" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar vacantes recibidas"
                aria-label="Buscar vacantes recibidas"
              />
            </label>
          </div>
          <Resource state={jobs} empty={!rows.length}>
            <div className="job-list">
              {rows.map((job: RecordData) => (
                <button
                  key={job.vacante_id}
                  aria-pressed={vacancy === job.vacante_id}
                  className={
                    "job " + (vacancy === job.vacante_id ? "selected" : "")
                  }
                  onClick={() => {
                    setVacancy(job.vacante_id);
                    setForm("");
                  }}
                >
                  <span className="job-icon">
                    <Icon name="briefcase" />
                  </span>
                  <strong>{job.titulo}</strong>
                  <span>{job.area}</span>
                  <div>
                    <Badge value={job.estado} />
                    <small>{dateText(job.fecha_publicacion)}</small>
                  </div>
                </button>
              ))}
            </div>
          </Resource>
        </section>
        <section className="panel candidate-panel">
          <div className="section-heading padded">
            <div>
              <span className="eyebrow">CANDIDATOS</span>
              <h2>
                {jobs.data?.find((j: RecordData) => j.vacante_id === vacancy)
                  ?.titulo || "Selecciona una vacante"}
              </h2>
            </div>
            {vacancy && (
              <button
                className="button secondary"
                onClick={() => setForm("candidate")}
              >
                <Icon name="plus" />
                Postulación
              </button>
            )}
          </div>
          {vacancy ? (
            <Resource state={people} empty={!people.data?.length}>
              <Table
                rows={people.data || []}
                rowKey="postulacion_id"
                columns={[
                  {
                    key: "nombre",
                    title: "Candidato",
                    render: (r) => (
                      <div>
                        <strong>{r.nombre}</strong>
                        <small className="block muted">{r.email}</small>
                      </div>
                    ),
                  },
                  stateColumn,
                  {
                    key: "fecha",
                    title: "Postulación",
                    render: (r) => dateText(r.fecha),
                  },
                ]}
                actions={(r) =>
                  r.estado !== "CONTRATADO" ? (
                    <button
                      className="text-button"
                      onClick={() => setCandidate(r)}
                    >
                      Actualizar etapa
                    </button>
                  ) : (
                    <span className="muted">Contratado</span>
                  )
                }
              />
            </Resource>
          ) : (
            <Empty text="Elige una oportunidad para consultar sus postulaciones." />
          )}
        </section>
      </div>
      {form && (
        <Editor
          key={form + vacancy}
          title={form === "job" ? "Crear vacante" : "Registrar postulación"}
          description={
            form === "candidate"
              ? "Ingresa datos reales de contratación. Al guardar podrás subir el CV; la postulación quedará registrada aunque la subida falle."
              : undefined
          }
          fields={
            form === "job"
              ? [f("titulo", "Título del puesto"), f("area", "Área")]
              : [
                  f("nombres", "Nombres"),
                  f("apellidos", "Apellidos"),
                  f("email", "Correo", { type: "email" }),
                  f("documento", "Documento", {
                    pattern: "[0-9]{8}",
                    minLength: 8,
                    maxLength: 8,
                  }),
                  f("salario_base", "Salario ofrecido (PEN)", {
                    type: "number",
                    min: 0.01,
                    step: 0.01,
                  }),
                  f("fecha_ingreso", "Fecha de ingreso prevista", {
                    type: "date",
                  }),
                ]
          }
          onClose={() => setForm("")}
          onSave={async (body) => {
            if (form === "job") {
              const r = await api("reclutamiento", "/vacantes", {
                method: "POST",
                body,
              });
              jobs.reload();
              setVacancy(r.vacante_id);
            } else {
              const r = await api("reclutamiento", "/postulaciones", {
                method: "POST",
                body: {
                  ...body,
                  nombre: body.nombres + " " + body.apellidos,
                  vacante_id: vacancy,
                },
              });
              setUpload({
                url: r.cv_upload_url,
                id: r.postulacion.postulacion_id,
                name: r.postulacion.nombre,
              });
              people.reload();
            }
            setMessage("Registro guardado correctamente.");
          }}
        />
      )}
      {candidate && (
        <Editor
          title={"Etapa de " + candidate.nombre}
          initial={{ estado: candidate.estado }}
          fields={[
            f("estado", "Nueva etapa", {
              options: [
                "RECIBIDO",
                "ENTREVISTA",
                "OFERTA",
                "CONTRATADO",
                "RECHAZADO",
              ].filter((s) => s !== candidate.estado),
            }),
          ]}
          description="Contratar crea la ficha y la cuenta mediante eventos del backend. No repitas la contratación si el servicio tarda en responder."
          onClose={() => setCandidate(null)}
          onSave={async (body) => {
            if (body.estado === "CONTRATADO") {
              if (
                !candidate.documento ||
                !candidate.salario_base ||
                !candidate.nombre ||
                !candidate.email
              )
                throw Error(
                  "La postulación no tiene todos los datos reales requeridos. El backend no permite editar estos datos: solicita su corrección antes de contratar.",
                );
              if (
                !window.confirm(
                  "¿Confirmas contratar a " + candidate.nombre + "?",
                )
              )
                throw Error("Operación cancelada.");
            }
            await api(
              "reclutamiento",
              "/postulaciones/" + id(candidate.postulacion_id) + "/estado",
              { method: "PATCH", body },
            );
            people.reload();
            setMessage(
              body.estado === "CONTRATADO"
                ? "Contratación enviada. La creación del empleado se procesa de forma asíncrona."
                : "Etapa actualizada.",
            );
          }}
        />
      )}
      {upload && <UploadCV value={upload} onClose={() => setUpload(null)} />}
    </>
  );
}
function UploadCV({
  value,
  onClose,
}: {
  value: RecordData;
  onClose: () => void;
}) {
  const action = useAction();
  const [done, setDone] = useState(false);
  return (
    <Modal title={"CV de " + value.name} onClose={onClose} busy={action.busy}>
      <p className="form-description">
        Postulación {value.id} guardada. Sube un PDF de hasta 10 MB. El enlace
        expira a los 10 minutos.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const file = new FormData(e.currentTarget).get("cv") as File;
          void action.run(async () => {
            if (
              !file?.size ||
              file.size > 10 * 1024 * 1024 ||
              !file.name.toLowerCase().endsWith(".pdf")
            )
              throw Error("Selecciona un archivo PDF de hasta 10 MB.");
            const header = new TextDecoder().decode(
              await file.slice(0, 5).arrayBuffer(),
            );
            if (header !== "%PDF-")
              throw Error("El archivo no contiene un PDF válido.");
            const url = new URL(value.url);
            if (
              url.protocol !== "https:" ||
              !url.hostname.endsWith(".amazonaws.com")
            )
              throw Error("Enlace de subida no válido.");
            const response = await fetch(url, {
              method: "PUT",
              headers: { "Content-Type": "application/pdf" },
              body: file,
              signal: AbortSignal.timeout(60000),
            });
            if (!response.ok)
              throw Error(
                "S3 rechazó el archivo. Reintenta mientras el enlace siga vigente. La API no ofrece renovación de enlaces.",
              );
            setDone(true);
          }, "CV subido correctamente.");
        }}
      >
        <div className="upload-zone">
          <Icon name="download" size={30} />
          <label>
            Currículum en PDF
            <input
              type="file"
              name="cv"
              accept="application/pdf,.pdf"
              required
              disabled={action.busy || done}
            />
          </label>
        </div>
        {action.notice}
        <footer>
          <button
            type="button"
            className="button secondary"
            disabled={action.busy}
            onClick={onClose}
          >
            Cerrar
          </button>
          {!done && (
            <button className="button primary" disabled={action.busy}>
              {action.busy ? "Subiendo…" : "Subir CV"}
            </button>
          )}
        </footer>
      </form>
    </Modal>
  );
}
export function Performance() {
  const { api, user } = useAuth();
  const boss = supervisor(user);
  const [employee, setEmployee] = useState(user.empleado_id || "");
  const [draft, setDraft] = useState(employee);
  const [edit, setEdit] = useState<RecordData | null>(null);
  const [recognition, setRecognition] = useState(false);
  const [message, setMessage] = useState("");
  const state = useResource(
    (s) =>
      employee
        ? api("desempeno", "/evaluaciones" + query({ empleado: employee }), {
            signal: s,
          })
        : Promise.resolve([]),
    [api, employee],
  );
  return (
    <>
      <Head
        title="Desempeño y crecimiento"
        description="Objetivos claros, conversaciones útiles y logros reconocidos."
      >
        {user.empleado_id && (
          <button
            className="button secondary"
            onClick={() => setRecognition(true)}
          >
            <Icon name="star" />
            Reconocer
          </button>
        )}
        {boss && (
          <button
            className="button primary"
            onClick={() =>
              setEdit({
                empleado_id: employee,
                evaluador_id: user.empleado_id,
                periodo: month(),
              })
            }
          >
            <Icon name="plus" />
            Nueva evaluación
          </button>
        )}
      </Head>
      <Notice text={message} />
      <section className="panel">
        {boss && (
          <form
            className="toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              setEmployee(draft.trim());
            }}
          >
            <label>
              Código del empleado
              <input
                required
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button className="button secondary">Consultar evaluaciones</button>
            <Refresh onClick={state.reload} />
          </form>
        )}
        <Resource state={state} empty={!state.data?.length}>
          <div className="evaluation-grid">
            {state.data?.map((r: RecordData) => (
              <article className="evaluation" key={r.evaluacion_id}>
                <div className="section-heading">
                  <span className="eyebrow">{r.periodo}</span>
                  <Badge value={r.estado} />
                </div>
                <h2>{r.empleado_id}</h2>
                <p className="muted">
                  Evaluador: {r.evaluador_id || "Sin asignar"}
                </p>
                <div className="score">
                  {r.puntaje ?? "—"}
                  <small>/ 5</small>
                </div>
                <h3>Objetivos</h3>
                {r.objetivos?.length ? (
                  <ul>
                    {r.objetivos.map((o: unknown, i: number) => (
                      <li key={i}>
                        {typeof o === "string" ? o : JSON.stringify(o)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Sin objetivos registrados.</p>
                )}
                <h3>Competencias</h3>
                <div className="chips">
                  {r.competencias?.map((c: unknown, i: number) => (
                    <span key={i}>
                      {typeof c === "string" ? c : JSON.stringify(c)}
                    </span>
                  ))}
                </div>
                <p className="evaluation-comment">
                  {r.comentarios || "Sin comentarios registrados."}
                </p>
                {boss && (
                  <button
                    className="button secondary"
                    onClick={() => setEdit(r)}
                  >
                    Editar evaluación
                  </button>
                )}
              </article>
            ))}
          </div>
        </Resource>
      </section>
      {edit && (
        <Editor
          title={edit.evaluacion_id ? "Editar evaluación" : "Nueva evaluación"}
          description="Escribe un objetivo o una competencia por línea. Completar una evaluación puede enviar notificaciones."
          initial={edit}
          fields={[
            ...(!edit.evaluacion_id
              ? [
                  f("empleado_id", "Código del empleado"),
                  f("evaluador_id", "Código del evaluador"),
                  f("periodo", "Periodo"),
                ]
              : [
                  f("estado", "Estado", {
                    options: ["PENDIENTE", "EN_PROGRESO", "COMPLETADA"],
                  }),
                ]),
            f("puntaje", "Puntaje (0 a 5)", {
              type: "number",
              min: 0,
              max: 5,
              step: 0.1,
              required: false,
            }),
            f("objetivos", "Objetivos", { type: "lines", required: false }),
            f("competencias", "Competencias", {
              type: "lines",
              required: false,
            }),
            f("comentarios", "Comentarios", {
              type: "textarea",
              required: false,
            }),
          ]}
          onClose={() => setEdit(null)}
          onSave={async (body) => {
            if (body.estado === "COMPLETADA" && body.puntaje == null)
              throw Error(
                "Indica el puntaje antes de completar la evaluación.",
              );
            await api(
              "desempeno",
              edit.evaluacion_id
                ? "/evaluaciones/" + id(edit.evaluacion_id)
                : "/evaluaciones",
              { method: edit.evaluacion_id ? "PUT" : "POST", body },
            );
            if (body.empleado_id) {
              setEmployee(body.empleado_id);
              setDraft(body.empleado_id);
            }
            state.reload();
            setMessage("Evaluación guardada.");
          }}
        />
      )}
      {recognition && (
        <Editor
          title="Reconocer a una persona"
          description="El reconocimiento se registra en el backend. El servicio actual no ofrece consulta del historial de reconocimientos."
          fields={[
            f("para_empleado_id", "Código del destinatario"),
            f("mensaje", "Mensaje", { type: "textarea" }),
          ]}
          onClose={() => setRecognition(false)}
          onSave={async (body) => {
            const r = await api("desempeno", "/reconocimientos", {
              method: "POST",
              body: { ...body, de_empleado_id: user.empleado_id },
            });
            setMessage("Reconocimiento registrado: " + r.reconocimiento_id);
          }}
        />
      )}
    </>
  );
}
export function Notifications() {
  const { api } = useAuth();
  const [filter, setFilter] = useState("");
  const action = useAction();
  const state = useResource(
    (s) =>
      api(
        "notificaciones",
        "/notificaciones" + query({ limit: 200, leida: filter }),
        { signal: s },
      ),
    [api, filter],
  );
  return (
    <>
      <Head
        title="Notificaciones"
        description="Las novedades de tu cuenta y de tu rol, en un solo lugar."
      >
        <Refresh onClick={state.reload} />
      </Head>
      {action.notice}
      <section className="panel">
        <div className="toolbar">
          <label>
            Mostrar
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Todas</option>
              <option value="false">Sin leer</option>
              <option value="true">Leídas</option>
            </select>
          </label>
          <small>Hasta 200 notificaciones devueltas por el servicio.</small>
        </div>
        <Resource state={state} empty={!state.data?.items?.length}>
          <div className="notification-list">
            {state.data?.items?.map((r: RecordData) => (
              <article
                className={"notification " + (!r.leida ? "unread" : "")}
                key={r.notificacion_id}
              >
                <span className="notification-icon">
                  <Icon name="bell" />
                </span>
                <div>
                  <span className="eyebrow">{label(r.tipo)}</span>
                  <p>{r.mensaje}</p>
                  <small>
                    {dateText(r.created_at)} · {r.leida ? "Leída" : "Sin leer"}
                  </small>
                </div>
                {!r.leida && (
                  <button
                    className="button secondary small"
                    disabled={action.busy}
                    onClick={() =>
                      action.run(async () => {
                        await api(
                          "notificaciones",
                          "/notificaciones/" + id(r.notificacion_id) + "/leida",
                          { method: "PATCH", body: {} },
                        );
                        state.reload();
                      }, "Notificación marcada como leída.")
                    }
                  >
                    <Icon name="check" size={16} />
                    Marcar leída
                  </button>
                )}
              </article>
            ))}
          </div>
        </Resource>
      </section>
    </>
  );
}
