import { CajaTurnoResponse } from './caja.models';

export type MetodoPago =
  | 'efectivo'
  | 'tarjeta_credito'
  | 'tarjeta_debito'
  | 'transferencia'
  | 'credito'
  | 'monedero';
export type EstadoVenta = 'pagada' | 'pendiente_pago' | 'cancelada' | 'devuelta_parcial' | 'devuelta_total';

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_debito', label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'transferencia', label: 'Transferencia' },
];

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
  /** Solo efectivo: con cuánto pagó el cliente (≥ `monto`). El backend guarda el cambio. */
  monto_recibido?: number | string | null;
}

export interface CrearVentaRequest {
  caja_turno_id: string;
  /** Requerido solo si queda saldo a crédito. */
  cliente_id?: string | null;
  /**
   * Teléfono para el monedero (cashback) y el historial por teléfono. No exige
   * `cliente` ni toca el crédito. Obligatorio si algún pago usa `metodo_pago: 'monedero'`.
   */
  telefono?: string | null;
  /** Habilita una promoción que exige cupón. */
  codigo_cupon?: string | null;
  /**
   * Obligatorio si se manda `descuento_linea` o `descuento_total` > 0. Se congela
   * en la venta y queda auditado. Requiere el permiso `ventas.descuento_manual`.
   */
  motivo_descuento?: string | null;
  descuento_total?: number | string;
  lineas: LineaVentaRequest[];
  pagos: PagoRequest[];
}

/** Una promo aplicada a una línea (desglose; una fila por promo). */
export interface PromoAplicada {
  promo_id: string;
  promo_etiqueta: string;
  monto: string;
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
  /** Descuento calculado por el motor de promociones (Σ de todas las promos de la línea). */
  promo_descuento?: string;
  /** Etiqueta de la promo de mayor monto. */
  promo_etiqueta?: string | null;
  /** Desglose: una fila por promo aplicada. */
  promos_aplicadas?: PromoAplicada[];
  /** Unidades ya devueltas de esta línea. */
  cantidad_devuelta?: string;
  subtotal: string;
}

export interface PagoResponse {
  id: string;
  monto: string;
  metodo_pago: MetodoPago;
  monto_recibido: string | null;
  /** `monto_recibido − monto` (0 salvo en efectivo con vuelto). */
  cambio: string;
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
  /** Total de efectivo entregado por el cliente. */
  efectivo_recibido: string;
  /** Vuelto total entregado. */
  cambio: string;
  saldo_pendiente: string;
  /** Teléfono asociado (monedero / historial), si se registró en la venta. */
  telefono?: string | null;
  /** Cashback acreditado al monedero del teléfono por esta venta. */
  monedero_generado?: string;
  /** Saldo de monedero consumido como pago en esta venta. */
  monedero_usado?: string;
  created_at: string;
  lineas: LineaVentaResponse[];
  pagos: PagoResponse[];
  cliente?: { id: string; nombre: string } | null;
  usuario?: { id: string; nombre: string } | null;
  caja_turno?: CajaTurnoResponse | null;
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
  telefono?: string | null;
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
  /** Filtra las ventas registradas con este teléfono (historial por monedero). */
  telefono?: string;
  estado?: EstadoVenta;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  include?: string;
}
