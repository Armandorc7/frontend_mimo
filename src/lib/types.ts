export type Role = "admin_rrhh" | "gerente" | "reclutador" | "empleado";
export interface User {
  user_id: string;
  nombre: string;
  email?: string;
  rol: Role;
  tenant_id: string;
  empresa_nombre?: string;
  ruc?: string;
  empleado_id?: string;
  debe_cambiar_password?: boolean;
}
export interface Session {
  token: string;
  expires_in: number;
  usuario: User;
}
// Service records have heterogeneous optional fields. Keep this boundary centralized.
export type RecordData = Record<string, any>;
export interface PageData<T = RecordData> {
  items: T[];
  next_token?: string | null;
}
export const supervisor = (u: User) =>
  ["admin_rrhh", "gerente"].includes(u.rol);
export const admin = (u: User) => u.rol === "admin_rrhh";
export const recruiter = (u: User) =>
  ["admin_rrhh", "reclutador"].includes(u.rol);
export const roleLabel: Record<Role, string> = {
  admin_rrhh: "Administración RR. HH.",
  gerente: "Gerencia",
  reclutador: "Reclutamiento",
  empleado: "Empleado",
};

// Explicit domain contracts at the API boundary; optional properties reflect legacy records.
export interface Employee {
  empleado_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  area: string;
  cargo: string;
  estado: "ACTIVO" | "VACACIONES" | "CESADO";
  documento?: string;
  fecha_ingreso?: string;
  salario_base?: number;
  jefe_id?: string | null;
  telefono?: string;
  direccion?: string;
  contacto_emergencia?: string;
  fecha_cese?: string;
}
export interface Vacancy {
  vacante_id: string;
  titulo: string;
  area: string;
  estado: string;
  fecha_publicacion?: string;
}
export interface Evaluation {
  evaluacion_id: string;
  empleado_id: string;
  evaluador_id?: string;
  periodo: string;
  estado: string;
  objetivos?: unknown[];
  competencias?: unknown[];
  puntaje?: number;
  comentarios?: string;
}
export interface OnboardingTask {
  onboarding_id: string;
  empleado_id: string;
  tarea: string;
  completada: boolean;
}
export interface Notification {
  notificacion_id: string;
  mensaje: string;
  leida: boolean;
  created_at?: string;
}
