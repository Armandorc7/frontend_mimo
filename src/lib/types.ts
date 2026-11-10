export type Role = "admin_rrhh" | "gerente" | "reclutador" | "empleado";
export interface User {
  user_id: string;
  nombre: string;
  email?: string;
  rol: Role;
  tenant_id: string;
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
export interface PageData {
  items: RecordData[];
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
