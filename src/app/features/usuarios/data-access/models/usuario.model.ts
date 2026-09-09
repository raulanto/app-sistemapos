import { RolResponse } from './rol.model';

export interface SucursalEmbed {
  id: string;
  nombre: string;
}

export interface UsuarioResponse {
  id: string;
  sucursal_id: string | null;
  rol_id: string;
  nombre: string;
  email: string;
  activo: boolean;
  last_login_at: string | null;
  rol: RolResponse | null;
  sucursal: SucursalEmbed | null;
}

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol_id: string;
  sucursal_id?: string | null;
}

/** PATCH /usuarios/{id}: solo datos de perfil. El rol se cambia por su endpoint propio. */
export interface EditarUsuarioRequest {
  nombre?: string;
  email?: string;
  sucursal_id?: string | null;
}

export interface CambiarRolRequest {
  rol_id: string;
}

export interface CambiarPasswordRequest {
  /** Requerida solo cuando un usuario cambia su propia contraseña. */
  password_actual?: string | null;
  password_nueva: string;
}

export interface UsuarioQuery {
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: created_at, email, last_login_at, nombre. */
  sort?: string;
  /** Relaciones a embeber, separadas por coma (ej. `rol,sucursal`). */
  include?: string;
}
