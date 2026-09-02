export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token?: string;
}

export interface LogoutRequest {
  refresh_token?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PermisoResponse {
  id: string;
  codigo: string;
  descripcion: string;
}

export interface RolResponse {
  id: string;
  codigo: string;
  nombre: string;
  permisos?: PermisoResponse[];
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  links?: any;
}
