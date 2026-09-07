export type MetodoPago = 'efectivo' | 'tarjeta_credito' | 'tarjeta_debito' | 'transferencia' | 'credito';
export type MetodoDevolucion = 'efectivo' | 'tarjeta' | 'credito';
export type EstadoVenta = 'pagada' | 'pendiente_pago' | 'cancelada' | 'devuelta_parcial' | 'devuelta_total';
export type EstadoCajaTurno = 'abierto' | 'cerrado';

export const METODOS_DEVOLUCION: { value: MetodoDevolucion; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo (sale del cajón)' },
  { value: 'tarjeta', label: 'Tarjeta (reverso)' },
  { value: 'credito', label: 'Crédito (baja la deuda)' },
];

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

/** Arqueo: solo efectivo. `saldo_esperado = saldo_inicial + total_efectivo − total_devoluciones_efectivo`. */
export interface ResumenTurnoResponse {
  turno: CajaTurnoResponse;
  total_efectivo: string;
  /** Devoluciones en efectivo hechas EN este turno (salió plata del cajón). */
  total_devoluciones_efectivo: string;
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
  /** Descuento calculado por el motor de promociones (congelado en la venta). */
  promo_descuento?: string;
  promo_etiqueta?: string | null;
  /** Unidades ya devueltas de esta línea. */
  cantidad_devuelta?: string;
  subtotal: string;
}

// --- Cotización (previsualiza promos + mayoreo antes de cobrar) ---
// POST /ventas/cotizar — no exige turno, no pide pagos, no toca stock.

/** El cuerpo usa las mismas líneas que la venta (`LineaVentaRequest`). */
export interface CotizarVentaRequest {
  descuento_total?: number | string;
  lineas: LineaVentaRequest[];
}

export interface CotizacionLinea {
  producto_id: string;
  producto_unidad_id: string | null;
  cantidad: string;
  cantidad_en_unidad_base: string | null;
  precio_unitario: string;
  descuento_linea: string;
  impuesto_tasa: string;
  promo_id: string | null;
  promo_etiqueta: string | null;
  promo_descuento: string;
  subtotal: string;
  /** Stock en la unidad de la línea; `null` = ilimitado (servicio, sobre pedido, kit). */
  stock_disponible: string | null;
  hay_stock: boolean;
}

export interface CotizacionVentaResponse {
  lineas: CotizacionLinea[];
  descuento_total: string;
  total_promociones: string;
  total: string;
}

// --- Corte de caja (desglose por método) ---

export interface CorteCajaResponse {
  caja_turno_id: string;
  monto_inicial: string;
  total_efectivo: string;
  total_tarjeta: string;
  total_transferencia: string;
  total_credito: string;
  total_descuento_promo: string;
  total_devoluciones_efectivo: string;
  monto_final_esperado: string;
  nota: string;
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
  total_promociones: string;
  /** Dinero total ya devuelto al cliente (suma de las devoluciones). */
  total_devuelto: string;
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

// --- Devoluciones ---

export interface DevolverVentaLineaRequest {
  detalle_venta_id: string;
  cantidad: number | string;
}

export interface DevolverVentaRequest {
  /** Turno EN QUE se hace la devolución (el abierto actual). */
  caja_turno_id: string;
  metodo_devolucion: MetodoDevolucion;
  lineas: DevolverVentaLineaRequest[];
  motivo?: string | null;
}

export interface DevolucionLineaResponse {
  id: string;
  detalle_venta_id: string;
  cantidad: string;
  monto: string;
}

export interface DevolucionResponse {
  id: string;
  venta_id: string;
  caja_turno_id: string;
  usuario_id: string;
  metodo_devolucion: MetodoDevolucion;
  monto_devuelto: string;
  motivo: string | null;
  created_at: string;
  lineas: DevolucionLineaResponse[];
}

/** Fila del listado `GET /ventas/` (más liviano que `VentaResponse`). */
export interface VentaListItem {
  id: string;
  sucursal_id: string;
  caja_turno_id: string;
  usuario_id: string;
  cliente_id: string | null;
  estado: EstadoVenta;
  total_promociones: string;
  total: string;
  saldo_pendiente: string;
  created_at: string;
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
