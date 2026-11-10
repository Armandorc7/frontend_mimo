import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { AuthContext } from "./lib/auth";
import { createApi } from "./lib/api";
import { admin, recruiter, roleLabel, supervisor } from "./lib/types";
import type { Session, User } from "./lib/types";
import { Brand, Icon, Notice } from "./components/ui";
import { Dashboard } from "./features/dashboard";
import {
  Employees,
  Onboarding,
  Organization,
  Profile,
  Users,
} from "./features/people";
import { Bands, Payroll } from "./features/payroll";
import { Attendance } from "./features/attendance";
import { Notifications, Performance, Recruiting } from "./features/talent";
import "./App.css";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="error-state">
        <h1>No pudimos mostrar esta pantalla</h1>
        <p>Recarga para iniciar una nueva sesión.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Recargar aplicación
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Login({
  onLogin,
  expired,
}: {
  onLogin: (s: Session) => void;
  expired: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    expired ? "La sesión terminó. Ingresa nuevamente." : "",
  );
  const [visible, setVisible] = useState(false);
  return (
    <main className="login">
      <section className="login-story">
        <Brand />
        <div className="login-message">
          <span className="eyebrow">EL LADO HUMANO DEL TRABAJO</span>
          <h1>
            El mejor lugar
            <br />
            para hacer
            <br />
            <em>crecer tu equipo.</em>
          </h1>
          <p>
            Una nueva forma de conectar personas,
            <br />
            acompañar su talento y trabajar mejor.
          </p>
          <div className="login-illustration" aria-hidden="true">
            <span className="illustration-leaf leaf-a" />
            <span className="illustration-leaf leaf-b" />
            <span className="illustration-leaf leaf-c" />
            <div className="illustration-center">m.</div>
            <span className="illustration-spark">✳</span>
          </div>
        </div>
        <footer>
          Personas · Tiempo · Talento<span>mimo HCM</span>
        </footer>
      </section>
      <section className="login-form-side">
        <div className="login-card">
          <div className="login-mobile-brand">
            <Brand />
          </div>
          <span className="login-tag">
            <span />
            TU ESPACIO DE TRABAJO
          </span>
          <h2>Qué bueno verte.</h2>
          <p>Ingresa para continuar con tu equipo.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              const form = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              try {
                const result = await createApi()<Session>(
                  "usuarios",
                  "/auth/login",
                  {
                    method: "POST",
                    body: {
                      email: String(form.get("email")).trim().toLowerCase(),
                      password: form.get("password"),
                    },
                  },
                );
                if (
                  !result.token ||
                  !result.usuario?.tenant_id ||
                  !result.usuario?.user_id ||
                  !Object.hasOwn(roleLabel, result.usuario.rol)
                )
                  throw Error("El servicio devolvió una sesión no válida.");
                onLogin(result);
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "No se pudo ingresar.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy}>
              <label>
                Correo electrónico
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  placeholder="nombre@empresa.com"
                />
              </label>
              <label>
                Contraseña
                <div className="password-field">
                  <input
                    type={visible ? "text" : "password"}
                    name="password"
                    required
                    minLength={8}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    aria-label={
                      visible ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    onClick={() => setVisible((v) => !v)}
                  >
                    {visible ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </label>
            </fieldset>
            <Notice text={error} error />
            <button className="button primary full" disabled={busy}>
              {busy ? "Iniciando sesión…" : "Entrar a mi espacio"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
          <div className="login-security">
            <Icon name="shield" size={17} />
            <span>Tu empresa se identifica desde tu cuenta.</span>
          </div>
          <p className="login-help">
            Si necesitas recuperar tu acceso, contacta al administrador de tu
            empresa.
          </p>
        </div>
        <span className="login-bottom">
          Hecho para las personas que hacen la diferencia.
        </span>
      </section>
    </main>
  );
}
const nav = [
  {
    to: "/",
    title: "Inicio",
    icon: "grid",
    group: "GENERAL",
    allow: () => true,
  },
  {
    to: "/personas",
    title: "Personas",
    icon: "users",
    group: "EQUIPO",
    allow: supervisor,
  },
  {
    to: "/organizacion",
    title: "Organización",
    icon: "tree",
    group: "EQUIPO",
    allow: supervisor,
  },
  {
    to: "/asistencia",
    title: "Asistencia",
    icon: "clock",
    group: "EQUIPO",
    allow: () => true,
  },
  {
    to: "/nominas",
    title: "Nóminas",
    icon: "wallet",
    group: "OPERACIONES",
    allow: () => true,
  },
  {
    to: "/bandas",
    title: "Bandas salariales",
    icon: "wallet",
    group: "OPERACIONES",
    allow: (u: User) => u.rol !== "empleado",
  },
  {
    to: "/reclutamiento",
    title: "Reclutamiento",
    icon: "briefcase",
    group: "TALENTO",
    allow: recruiter,
  },
  {
    to: "/onboarding",
    title: "Onboarding",
    icon: "check",
    group: "TALENTO",
    allow: () => true,
  },
  {
    to: "/desempeno",
    title: "Desempeño",
    icon: "star",
    group: "TALENTO",
    allow: () => true,
  },
  {
    to: "/notificaciones",
    title: "Notificaciones",
    icon: "bell",
    group: "MI ESPACIO",
    allow: () => true,
  },
  {
    to: "/usuarios",
    title: "Usuarios y accesos",
    icon: "shield",
    group: "MI ESPACIO",
    allow: admin,
  },
  {
    to: "/perfil",
    title: "Mi perfil",
    icon: "users",
    group: "MI ESPACIO",
    allow: () => true,
  },
];
function Shell({
  session,
  logout,
  onExpired,
  passwordChanged,
}: {
  session: Session;
  logout: () => void;
  onExpired: () => void;
  passwordChanged: () => void;
}) {
  const user = session.usuario;
  const api = useMemo(
    () => createApi(session.token, onExpired),
    [session.token, onExpired],
  );
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const company =
    (
      { andina: "Andina", pacifico: "Pacífico", sierra: "Sierra" } as Record<
        string,
        string
      >
    )[user.tenant_id] || user.tenant_id;
  const entries = nav.filter((n) => n.allow(user));
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus();
    document.title =
      (nav.find((n) => n.to === location.pathname)?.title ||
        "Página no encontrada") + " · Mimo";
  }, [location.pathname]);
  useEffect(() => {
    if (menu) {
      menuRef.current?.showModal();
    } else if (menuRef.current?.open) {
      menuRef.current.close();
      menuButton.current?.focus();
    }
  }, [menu]);
  const navigation = (
    <>
      <div className="sidebar-brand">
        <Link to="/" aria-label="Mimo, inicio">
          <Brand />
        </Link>
      </div>
      <div className="workspace">
        <span className="company-symbol">{company[0]}</span>
        <div>
          <strong>{company}</strong>
          <small>Espacio de trabajo</small>
        </div>
        <Icon name="shield" size={16} />
      </div>
      <nav aria-label="Navegación principal">
        {entries.map((n, i) => (
          <div key={n.to}>
            {entries[i - 1]?.group !== n.group && (
              <p className="nav-group">{n.group}</p>
            )}
            <NavLink
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                "nav-link " + (isActive ? "active" : "")
              }
              onClick={() => setMenu(false)}
            >
              <Icon name={n.icon} size={19} />
              {n.title}
            </NavLink>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <span className="sidebar-note">
          <span className="small-flower">✳</span>El talento nos une.
        </span>
        <div className="user-summary">
          <span className="avatar">{user.nombre.slice(0, 1)}</span>
          <div>
            <strong>{user.nombre}</strong>
            <small>{roleLabel[user.rol]}</small>
          </div>
          <button
            className="icon-button"
            aria-label="Cerrar sesión"
            onClick={logout}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </>
  );
  const guard = (ok: boolean, element: ReactNode) =>
    ok ? (
      element
    ) : (
      <section className="panel padded">
        <h1>Acceso restringido</h1>
        <p>Tu rol no tiene acceso a esta sección.</p>
        <Link className="button secondary" to="/">
          Volver al inicio
        </Link>
      </section>
    );
  return (
    <AuthContext.Provider value={{ user, api, logout, passwordChanged }}>
      <div className="app">
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <aside className="sidebar">{navigation}</aside>
        <dialog
          ref={menuRef}
          className="mobile-drawer"
          onCancel={() => setMenu(false)}
        >
          <button
            className="button secondary drawer-close"
            onClick={() => setMenu(false)}
          >
            <Icon name="close" />
            Cerrar menú
          </button>
          {navigation}
        </dialog>
        <div className="app-content">
          <header className="topbar">
            <div className="topbar-start">
              <button
                ref={menuButton}
                className="icon-button mobile-toggle"
                aria-label="Abrir menú"
                aria-expanded={menu}
                onClick={() => setMenu(true)}
              >
                <Icon name="menu" />
              </button>
              <span className="breadcrumb">
                Mi espacio <span>/</span>{" "}
                <strong>
                  {nav.find((n) => n.to === location.pathname)?.title ||
                    "Página"}
                </strong>
              </span>
            </div>
            <div className="topbar-end">
              <span className="company-chip">
                <span />
                {company}
              </span>
              <Link
                to="/notificaciones"
                className="icon-button"
                aria-label="Abrir notificaciones"
              >
                <Icon name="bell" />
              </Link>
              <Link
                to="/perfil"
                className="avatar"
                aria-label="Abrir mi perfil"
              >
                {user.nombre.slice(0, 1)}
              </Link>
            </div>
          </header>
          <main id="main" ref={mainRef} tabIndex={-1}>
            {user.debe_cambiar_password && (
              <div className="notice">
                Tu cuenta utiliza una contraseña inicial.{" "}
                <Link to="/perfil">Actualízala desde tu perfil.</Link>
              </div>
            )}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/personas"
                element={guard(supervisor(user), <Employees />)}
              />
              <Route
                path="/organizacion"
                element={guard(supervisor(user), <Organization />)}
              />
              <Route path="/asistencia" element={<Attendance />} />
              <Route path="/nominas" element={<Payroll />} />
              <Route
                path="/bandas"
                element={guard(user.rol !== "empleado", <Bands />)}
              />
              <Route
                path="/reclutamiento"
                element={guard(recruiter(user), <Recruiting />)}
              />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/desempeno" element={<Performance />} />
              <Route path="/notificaciones" element={<Notifications />} />
              <Route path="/usuarios" element={guard(admin(user), <Users />)} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route
                path="*"
                element={
                  <section className="panel padded">
                    <h1>Página no encontrada</h1>
                    <Link to="/" className="button primary">
                      Volver al inicio
                    </Link>
                  </section>
                }
              />
            </Routes>
          </main>
          <footer className="app-footer">
            <span>
              mimo. <span>Personas primero.</span>
            </span>
            <span>Tu espacio, tu equipo.</span>
          </footer>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [expired, setExpired] = useState(false);
  const logout = useCallback(() => {
    setSession(null);
    setExpired(false);
  }, []);
  const expire = useCallback((token?: string) => {
    setSession((current) => {
      if (token && current?.token !== token) return current;
      setExpired(true);
      return null;
    });
  }, []);
  const sessionToken = session?.token;
  const sessionTtl = session?.expires_in;
  useEffect(() => {
    if (!sessionToken) return;
    const t = setTimeout(
      () => expire(sessionToken),
      Math.max(1, sessionTtl || 3600) * 1000,
    );
    return () => clearTimeout(t);
  }, [sessionToken, sessionTtl, expire]);
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {session ? (
          <Shell
            key={session.usuario.tenant_id + session.usuario.user_id}
            session={session}
            logout={logout}
            onExpired={() => expire(session.token)}
            passwordChanged={() =>
              setSession((s) =>
                s
                  ? {
                      ...s,
                      usuario: { ...s.usuario, debe_cambiar_password: false },
                    }
                  : s,
              )
            }
          />
        ) : (
          <Login onLogin={setSession} expired={expired} />
        )}
      </BrowserRouter>
    </ErrorBoundary>
  );
}
