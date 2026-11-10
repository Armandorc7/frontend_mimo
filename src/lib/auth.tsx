import { createContext, useContext } from "react";
import type { Api } from "./api";
import type { User } from "./types";
export const AuthContext = createContext<{
  user: User;
  api: Api;
  logout: () => void;
  passwordChanged: () => void;
} | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Sesión requerida");
  return value;
}
