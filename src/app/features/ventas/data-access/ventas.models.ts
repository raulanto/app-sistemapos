export type MetodoPago = 'efectivo' | 'tarjeta_credito' | 'tarjeta_debito' | 'transferencia' | 'credito';
export type EstadoVenta = 'pagada' | 'pendiente_pago' | 'cancelada' | 'devuelta_parcial' | 'devuelta_total';
export type EstadoCajaTurno = 'abierto' | 'cerrado';

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_debito', label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'transferencia', label: 'Transferencia' },
];

// --- Caja / turnos ---

export interface CajaTurnoResponse {
  id: string;
  sucursal_id: string;
  usuario_id: string;
  saldo_inicial: string;
  estado: EstadoCajaTurno | string;
  abierto_en: string;
  cerrado_en: string | null;
  saldo_final_declarado: string | null;
  diferencia: string | null;
}

export interface AbrirTurnoRequest {
  saldo_inicial: number | string;
}

export interface CerrarTurnoRequest {
  saldo_final_declarado: number | string;
}

/** Arqueo: solo efectivo. `saldo_esperado = saldo_inicial + total_efectivo`. */
export interface ResumenTurnoResponse {
  turno: CajaTurnoResponse;
  total_efectivo: string;
  cantidad_ventas: number;
  saldo_esperado: string;
}

// --- Ventas ---

export interface LineaVentaRequest {
  producto_id: string;
  cantidad: number | string;
  precio_unitario: number | string;
  descuento_linea?: number | string;
  impuesto_tasa?: number | string;
  /** null = unidad base; con id se vende esa presentación (precio = el de la presentación). */
  producto_unidad_id?: string | null;
}

export interface PagoRequest {
  monto: number | string;
  metodo_pago: MetodoPago;
}

export interface CrearVentaRequest {
  caja_turno_id: string;
  /** Requerido solo si queda saldo a crédito. */
  cliente_id?: string | null;
  descuento_total?: number | string;
  lineas: LineaVentaRequest[];
  pagos: PagoRequest[];
}

export interface LineaVentaResponse {
  id: string;
  producto_id: string;
  producto_unidad_id: string | null;
  cantidad: string;
  cantidad_en_unidad_base: string | null;
  precio_unitario: string;
  descuento_linea: string;
  impuesto_tasa: string;
  subtotal: string;
}

export interface PagoResponse {
  id: string;
  monto: string;
  metodo_pago: MetodoPago;
}

export interface VentaResponse {
  id: string;
  sucursal_id: string;
  caja_turno_id: string;
  usuario_id: string;
  cliente_id: string | null;
  estado: EstadoVenta;
  descuento_total: string;
  total: string;
  monto_pagado: string;
  saldo_pendiente: string;
  created_at: string;
  lineas: LineaVentaResponse[];
  pagos: PagoResponse[];
  cliente?: { id: string; nombre: string } | null;
  usuario?: { id: string; nombre: string } | null;
  caja_turno?: CajaTurnoResponse | null;
}

export interface AnularVentaRequest {
  motivo?: string | null;
}

export interface VentaQuery {
  caja_turno_id?: string;
  cliente_id?: string;
  estado?: EstadoVenta;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  include?: string;
}

// --- Cliente (mínimo, para venta a crédito) ---

export interface ClienteResponse {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  limite_credito: string;
  saldo_credito: string;
  activo: boolean;
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
  meta?: { pagination?: PaginationMeta };
  links?: unknown;
}
