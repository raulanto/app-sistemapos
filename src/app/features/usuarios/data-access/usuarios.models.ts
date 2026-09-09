// Contratos del módulo de usuarios / roles / permisos (ver openapi.json).

export interface PermisoResponse {
  id: string;
  codigo: string;
  descripcion: string;
}

export interface RolResponse {
  id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string;
  permisos: PermisoResponse[];
}

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

export interface CrearRolRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  permiso_ids?: string[];
}

/** PATCH /roles/{id}: solo nombre y descripción (el código es inmutable). */
export interface EditarRolRequest {
  nombre: string;
  descripcion?: string;
}

/** POST /roles/{id}/permisos — añade permisos (mínimo 1). Quitar es un DELETE por permiso. */
export interface AsignarPermisosRequest {
  permiso_ids: string[];
}

export interface UsuarioQuery {
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: created_at, email, last_login_at, nombre. */
  sort?: string;
  /** Relaciones a embeber, separadas por coma (ej. `rol,sucursal`). */
  include?: string;
}

export interface RolQuery {
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: codigo, nombre. */
  sort?: string;
}

export type { PaginationMeta, ApiResponse } from '@core/api.model';
