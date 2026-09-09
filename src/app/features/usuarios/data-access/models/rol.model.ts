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

export interface RolQuery {
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: codigo, nombre. */
  sort?: string;
}
