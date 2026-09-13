/** Silla, cabina, equipo… Sólo aplica si el servicio `requiere_recurso`. */
export interface RecursoResponse {
  id: string;
  sucursal_id: string;
  nombre: string;
  tipo: string | null;
  activo: boolean;
  created_at: string;
}

export interface RecursoCreateRequest {
  nombre: string;
  tipo?: string | null;
}

export interface RecursoRenameRequest {
  nombre: string;
}

export interface RecursoQuery {
  sucursal_id?: string | null;
  incluir_inactivos?: boolean;
}

/** Horario propio del recurso. Sin filas = sin restricción propia (sólo choca por cita solapada). */
export interface HorarioRecursoRequest {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface HorarioRecursoResponse {
  id: string;
  recurso_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}
