/**
 * Envelope estándar de la API del backend.
 *
 * Fuente única — cualquier feature que consuma la API importa desde aquí.
 * La forma refleja exactamente el schema de openapi.json.
 */

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
    filters?: unknown;
    summary?: unknown;
  };
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}
