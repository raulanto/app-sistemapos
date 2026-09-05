export interface SucursalResponse {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  created_at: string;
}

export interface CrearSucursalRequest {
  nombre: string;
  direccion: string;
  telefono: string;
}

export interface ActualizarSucursalRequest {
  nombre?: string;
  direccion?: string;
  telefono?: string;
}

export interface SucursalQuery {
  /** Busca en nombre, dirección y teléfono. */
  q?: string | null;
  activo?: boolean | null;
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos soportados por el backend: created_at, nombre. */
  sort?: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    sort?: string;
    filters?: any;
    summary?: any;
  };
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}
