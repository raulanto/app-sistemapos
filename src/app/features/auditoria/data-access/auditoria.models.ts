export interface AuditoriaLogResponse {
  id: string;
  usuario_id: string | null;
  modulo: string;
  accion: string;
  entidad?: string | null;
  entidad_id?: string | null;
  detalle?: Record<string, unknown> | null;
  ip_address?: string | null;
  fecha: string;
  created_at?: string;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
  };
}

export interface AuditoriaQuery {
  q?: string;
  modulo?: string;
  accion?: string;
  entidad?: string;
  entidad_id?: string;
  usuario_id?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  include?: string;
}

