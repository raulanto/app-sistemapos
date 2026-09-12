import type { MetodoPago, PagoRequest, VentaResponse } from '@/features/ventas/data-access/ventas.models';

export type { MetodoPago, PagoRequest, VentaResponse };

export type EstadoCita =
  | 'por_asignar'
  | 'asignada'
  | 'en_proceso'
  | 'completada'
  | 'cancelada'
  | 'no_show'
  | 'sin_empleado_disponible';

export const ESTADOS_CITA: { value: EstadoCita; label: string }[] = [
  { value: 'por_asignar', label: 'Por asignar' },
  { value: 'asignada', label: 'Asignada' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'no_show', label: 'No-show' },
  { value: 'sin_empleado_disponible', label: 'Sin empleado disponible' },
];

export type EstadoAsignacion = 'ofrecida' | 'aceptada' | 'rechazada' | 'superada';

export const ESTADOS_ASIGNACION: { value: EstadoAsignacion; label: string }[] = [
  { value: 'ofrecida', label: 'Ofrecida' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'rechazada', label: 'Rechazada' },
  /** No es un rechazo: otro candidato aceptó primero. */
  { value: 'superada', label: 'Superada' },
];

/** Fila liviana del cliente embebida en la cita (`?include=cliente`). */
export interface ClienteEmbed {
  id: string;
  sucursal_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  limite_credito: string;
  saldo_credito: string;
  activo: boolean;
}

/** Fila liviana del empleado embebida en la cita (`?include=empleado`). */
export interface UsuarioEmbed {
  id: string;
  nombre: string;
  email: string;
  rol_id: string;
  sucursal_id: string | null;
  activo: boolean;
}

/** Una oferta de la cita a un candidato. El primero en `aceptada` se la queda; el resto queda `superada`. */
export interface CitaAsignacionResponse {
  id: string;
  empleado_id: string;
  estado: EstadoAsignacion;
  fecha_oferta: string;
  fecha_respuesta: string | null;
}

export interface CitaResponse {
  id: string;
  servicio_id: string;
  sucursal_id: string;
  cliente_id: string | null;
  recurso_id: string | null;
  empleado_id: string | null;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoCita;
  disponibilidad_cruzada: boolean;
  politica_cancelacion_horas: number | null;
  penalizacion_cancelacion: string | null;
  motivo_cancelacion: string | null;
  /** Si tiene valor, la cita ya está facturada (`detalle_venta.id`). */
  venta_detalle_id: string | null;
  creado_por_usuario_id: string;
  created_at: string;
  asignaciones: CitaAsignacionResponse[];
  cliente?: ClienteEmbed | null;
  empleado?: UsuarioEmbed | null;
}

export interface CrearCitaRequest {
  servicio_id: string;
  fecha_hora_inicio: string;
  cliente_id?: string | null;
  /** Si el servicio requiere recurso y no se manda, el backend elige uno libre. */
  recurso_id?: string | null;
  /** Requiere que el servicio tenga `disponibilidad_cruzada_activa`; si no, 400 SucursalCruzadaNoPermitida. */
  disponibilidad_cruzada?: boolean;
  politica_cancelacion_horas?: number | null;
  penalizacion_cancelacion?: number | string | null;
}

/** Salta la cola de ofertas y fuerza un empleado (sigue validando calificación y disponibilidad). */
export interface AsignarManualRequest {
  empleado_id: string;
}

export interface CancelarCitaRequest {
  motivo?: string | null;
}

/** `pagos` vacío = a crédito (si el cliente tiene línea disponible), igual que una venta normal. */
export interface FacturarCitaRequest {
  caja_turno_id: string;
  pagos?: PagoRequest[];
}

const MENSAJES_ERROR_CITA: Record<string, string> = {
  ServicioNoAgendable: 'Ese servicio no es agendable: falta marcarlo como tipo "servicio" con una duración.',
  SucursalCruzadaNoPermitida: 'Este servicio no tiene activada la disponibilidad cruzada entre sucursales.',
  EmpleadoNoCalificado: 'Ese empleado no está calificado para este servicio.',
  CitaNoOfertable: 'Esta cita ya no se puede reofertar en su estado actual.',
  OfertaNoVigente: 'Esa oferta ya no está vigente (fue aceptada, rechazada o superada).',
  TransicionCitaInvalida: 'La cita no puede pasar a ese estado desde el estado actual.',
  CitaNoFacturable: 'Sólo se puede cobrar una cita completada.',
  AsignacionNoPropia: 'Esa oferta no es tuya.',
  RecursoNoEncontrado: 'El recurso no existe.',
  CitaNoEncontrada: 'La cita no existe.',
  NombreRecursoEnUso: 'Ya hay un recurso activo con ese nombre en la sucursal.',
  EmpleadoYaAsignado: 'Ese empleado ya tiene otra cita asignada que se solapa con este horario.',
  RecursoNoDisponible: 'El recurso quedó ocupado por otra cita justo antes de confirmar.',
  CitaYaFacturada: 'Esta cita ya tiene una venta vinculada.',
};

/**
 * Traduce el error del backend (Parte 8 de la guía) a un mensaje accionable.
 * En la práctica el backend manda `code: "BAD_REQUEST"` genérico con el detalle sólo en
 * `message` (mismo patrón que `pedidos`, ver `mensajePedidoError`) — el mapa por código
 * queda como respaldo si algún día manda códigos tipados, y el texto es el que realmente
 * decide hoy.
 */
export function mensajeCitaError(err: unknown, fallback: string): string {
  const e = err as { error?: { error?: { code?: string; message?: string } } };
  const code = e?.error?.error?.code;
  const raw = e?.error?.error?.message;
  if (code && code !== 'BAD_REQUEST' && MENSAJES_ERROR_CITA[code]) return MENSAJES_ERROR_CITA[code];
  if (raw?.includes('no está calificado')) return MENSAJES_ERROR_CITA['EmpleadoNoCalificado'];
  return raw || fallback;
}

export interface CitaQuery {
  sucursal_id?: string | null;
  servicio_id?: string | null;
  empleado_id?: string | null;
  cliente_id?: string | null;
  estado?: EstadoCita | null;
  /** ISO date-time. */
  desde?: string | null;
  hasta?: string | null;
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: created_at, fecha_hora_inicio. */
  sort?: string;
  /** Separadas por coma: `cliente`, `empleado`. */
  include?: string;
}
