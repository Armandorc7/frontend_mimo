import { Link } from "react-router";
import { useAuth } from "../lib/auth";
import { supervisor } from "../lib/types";
import type { RecordData } from "../lib/types";
import { dateText, id, money, month, number } from "../lib/api";
import {
  Badge,
  Head,
  Icon,
  Notice,
  personColumn,
  Resource,
  stateColumn,
  Table,
  useResource,
} from "../components/ui";
export function Dashboard() {
  const { api, user } = useAuth();
  const boss = supervisor(user);
  const people = useResource(
    (s) =>
      boss
        ? api("empleados", "/empleados/resumen", { signal: s })
        : user.empleado_id
          ? api("asistencia", "/ausencias/saldo/" + id(user.empleado_id), {
              signal: s,
            })
          : Promise.resolve(null),
    [api, boss, user.empleado_id],
  );
  const payroll = useResource(
    (s) =>
      boss
        ? api("nominas", "/nominas/resumen?periodo=" + month(), { signal: s })
        : user.empleado_id
          ? api(
              "nominas",
              "/nominas/empleado/" + id(user.empleado_id) + "?limit=1",
              { signal: s },
            )
          : Promise.resolve(null),
    [api, boss, user.empleado_id],
  );
  const team = useResource(
    (s) =>
      boss
        ? api("empleados", "/empleados?limit=5", { signal: s })
        : user.empleado_id
          ? api("reclutamiento", "/onboarding/" + id(user.empleado_id), {
              signal: s,
            })
          : Promise.resolve([]),
    [api, boss, user.empleado_id],
  );
  const notices = useResource(
    (s) =>
      api("notificaciones", "/notificaciones?limit=200&leida=false", {
        signal: s,
      }),
    [api],
  );
  const stats = [
    {
      title: boss ? "Personas en tu empresa" : "Vacaciones disponibles",
      icon: "users",
      state: people,
      value: people.data
        ? number(boss ? people.data.total : people.data.dias_disponibles)
        : "—",
      note: boss ? "Todos los estados" : "Días del año actual",
    },
    {
      title: boss ? "Nómina del mes" : "Última boleta",
      icon: "wallet",
      state: payroll,
      value: payroll.data
        ? boss
          ? payroll.data.estado
            ? money(payroll.data.total_neto)
            : "Sin planilla"
          : payroll.data.nominas?.items?.length
            ? money(payroll.data.nominas.items[0].neto)
            : "Sin boletas"
        : "—",
      note: boss ? month() : "Última disponible",
    },
    {
      title: "Pendientes de lectura",
      icon: "bell",
      state: notices,
      value: notices.data ? number(notices.data.items?.length) : "—",
      note: "En las últimas 200 notificaciones",
    },
  ];
  const areas = Object.entries(people.data?.por_area || {})
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 6);
  return (
    <>
      <Head
        title={"Hola, " + user.nombre.split(" ")[0]}
        description="Aquí empieza un buen día para tu equipo."
      />
      <section className="welcome">
        <div>
          <span className="eyebrow">PERSONAS QUE HACEN LA DIFERENCIA</span>
          <h2>
            Todo tu equipo.
            <br />
            Un mismo espacio.
          </h2>
          <p>Personas, tiempo y talento, conectados para avanzar.</p>
          <Link className="button light" to={boss ? "/personas" : "/perfil"}>
            {boss ? "Explorar mi equipo" : "Ver mi perfil"}
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-card">
            <span className="art-icon">m.</span>
            <span>El talento nos une.</span>
            <i />
            <i />
            <i />
          </div>
          <span className="floating-dot dot-one" />
          <span className="floating-dot dot-two" />
          <span className="art-star">✳</span>
        </div>
      </section>
      <div className="section-heading">
        <h2>Tu empresa, de un vistazo</h2>
        <span className="muted small-text">
          Datos de los servicios conectados
        </span>
      </div>
      <div className="stats">
        {stats.map((stat) => (
          <section className="stat" key={stat.title}>
            <div className="stat-label">
              <span>{stat.title}</span>
              <Icon name={stat.icon} />
            </div>
            <Resource state={stat.state}>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </Resource>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading padded">
            <div>
              <h2>{boss ? "Directorio del equipo" : "Mi incorporación"}</h2>
              <p className="muted">
                {boss
                  ? "Una ventana a las personas de tu empresa."
                  : "Tareas para comenzar con el pie derecho."}
              </p>
            </div>
            <Link
              className="text-button"
              to={boss ? "/personas" : "/onboarding"}
            >
              Ver todo →
            </Link>
          </div>
          <Resource
            state={team}
            empty={boss ? !team.data?.items?.length : !team.data?.length}
          >
            {boss ? (
              <Table
                rows={team.data?.items || []}
                rowKey="empleado_id"
                columns={[
                  personColumn,
                  { key: "area", title: "Área" },
                  stateColumn,
                ]}
              />
            ) : (
              <div className="task-list">
                {team.data?.slice(0, 5).map((t: RecordData) => (
                  <div key={t.onboarding_id}>
                    <span>{t.tarea}</span>
                    <Badge value={t.completada ? "COMPLETADA" : "PENDIENTE"} />
                  </div>
                ))}
              </div>
            )}
          </Resource>
        </section>
        <section className="panel">
          <div className="section-heading padded">
            <h2>Tu bandeja</h2>
            <Link to="/notificaciones" className="text-button">
              Abrir →
            </Link>
          </div>
          <Resource state={notices} empty={!notices.data?.items?.length}>
            <div className="mini-notices">
              {notices.data?.items?.slice(0, 4).map((n: RecordData) => (
                <article key={n.notificacion_id}>
                  <span className="notice-dot" />
                  <div>
                    <p>{n.mensaje}</p>
                    <small>{dateText(n.created_at)}</small>
                  </div>
                </article>
              ))}
            </div>
          </Resource>
        </section>
      </div>
      {boss && (
        <section className="panel padded">
          <div className="section-heading">
            <h2>Distribución por área</h2>
            <Link to="/organizacion" className="text-button">
              Explorar organización →
            </Link>
          </div>
          <Resource state={people} empty={!areas.length}>
            <div className="area-bars">
              {areas.map(([area, total]) => (
                <div key={area}>
                  <div>
                    <span>{area}</span>
                    <strong>{number(total)}</strong>
                  </div>
                  <progress
                    max={Math.max(...areas.map(([, v]) => Number(v)), 1)}
                    value={Number(total)}
                    aria-label={area}
                  />
                </div>
              ))}
            </div>
          </Resource>
        </section>
      )}
      {!user.empleado_id && !boss && (
        <Notice text="Tu cuenta requiere vinculación a un empleado para consultar información personal." />
      )}
    </>
  );
}
