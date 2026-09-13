/** `dia_semana`: 0=lunes … 6=domingo (a diferencia del bitmask de promociones). */
export const DIAS_SEMANA_AGENDA: { value: number; label: string; corto: string }[] = [
  { value: 0, label: 'Lunes', corto: 'Lun' },
  { value: 1, label: 'Martes', corto: 'Mar' },
  { value: 2, label: 'Miércoles', corto: 'Mié' },
  { value: 3, label: 'Jueves', corto: 'Jue' },
  { value: 4, label: 'Viernes', corto: 'Vie' },
  { value: 5, label: 'Sábado', corto: 'Sáb' },
  { value: 6, label: 'Domingo', corto: 'Dom' },
];

/** Qué empleados (usuarios) atienden qué servicio. */
export interface EmpleadoServicioResponse {
  id: string;
  empleado_id: string;
  servicio_id: string;
  activo: boolean;
  created_at: string;
}

export interface HorarioBaseRequest {
  sucursal_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface HorarioBaseResponse {
  id: string;
  empleado_id: string;
  sucursal_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

export type TipoExcepcion = 'bloqueo' | 'horario_especial';

export const TIPOS_EXCEPCION: { value: TipoExcepcion; label: string; hint: string }[] = [
  { value: 'bloqueo', label: 'Bloqueo', hint: 'No atiende. Sin horas = todo el día' },
  { value: 'horario_especial', label: 'Horario especial', hint: 'Reemplaza el horario base ese día' },
];

export interface ExcepcionRequest {
  fecha: string;
  tipo: TipoExcepcion;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  motivo?: string | null;
}

export interface ExcepcionResponse {
  id: string;
  empleado_id: string;
  fecha: string;
  tipo: TipoExcepcion;
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string | null;
}
