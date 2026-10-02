export interface Notificacion {
  id: string;
  usuario_id: string;
  sucursal_id?: string | null;
  modulo: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_leida?: string | null;
  entidad?: string | null;
  entidad_id?: string | null;
  datos?: Record<string, any>;
  created_at: string;
}

export interface ResumenNotificaciones {
  unread_count: number;
}
