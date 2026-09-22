import { ApiResponse, PaginationMeta } from '@core/api.model';

export interface AuditoriaLogResponse {
  id: string;
  usuario_id: string | null;
  sucursal_id: string | null;
  accion: string;
  modulo: string;
  recurso_tipo: string;
  recurso_id: string | null;
  detalles: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
  };
  sucursal?: {
    id: string;
    nombre: string;
  };
}

export interface AuditoriaQuery {
  q?: string;
  modulo?: string;
  accion?: string;
  usuario_id?: string;
  sucursal_id?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
  sort?: string;
}
