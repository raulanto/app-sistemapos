export type TipoPromocion = 'nxm' | 'porcentaje' | 'precio_fijo';

export const TIPOS_PROMOCION: { value: TipoPromocion; label: string; hint: string }[] = [
  { value: 'nxm', label: 'N x M', hint: '2x1, 3x2… regala las unidades más baratas' },
  { value: 'porcentaje', label: 'Porcentaje', hint: '% de descuento sobre la línea' },
  { value: 'precio_fijo', label: 'Precio fijo', hint: 'Precio unitario forzado (solo si es menor)' },
];

/** Método de pago que una promo puede exigir en los pagos de la venta. */
export type MetodoPagoPromo =
  | 'efectivo'
  | 'tarjeta_credito'
  | 'tarjeta_debito'
  | 'transferencia'
  | 'credito'
  | 'monedero';

export const METODOS_PAGO_PROMO: { value: MetodoPagoPromo; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_debito', label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito', label: 'Crédito' },
  { value: 'monedero', label: 'Monedero' },
];

/** `dias_semana` es un bitmask: lunes = bit 0 (1) … domingo = bit 6 (64). `null` = todos. */
export const DIAS_SEMANA: { bit: number; label: string; corto: string }[] = [
  { bit: 1, label: 'Lunes', corto: 'Lun' },
  { bit: 2, label: 'Martes', corto: 'Mar' },
  { bit: 4, label: 'Miércoles', corto: 'Mié' },
  { bit: 8, label: 'Jueves', corto: 'Jue' },
  { bit: 16, label: 'Viernes', corto: 'Vie' },
  { bit: 32, label: 'Sábado', corto: 'Sáb' },
  { bit: 64, label: 'Domingo', corto: 'Dom' },
];

export interface ObjetivoRequest {
  /**
   * Exactamente uno de los tres: `producto_id` (venta por unidad base),
   * `producto_unidad_id` (esa presentación) o `categoria_id` (cualquier producto de la categoría).
   */
  producto_id?: string | null;
  producto_unidad_id?: string | null;
  categoria_id?: string | null;
}

export interface ObjetivoResponse {
  id: string;
  producto_id: string | null;
  producto_unidad_id: string | null;
  categoria_id: string | null;
}

export interface PromocionResponse {
  id: string;
  nombre: string;
  tipo: TipoPromocion;
  activo: boolean;
  prioridad: number;
  /** `false` = exclusiva por línea. `true` = se apila sobre el residual. */
  combinable: boolean;
  /** Máximo $ que la promo descuenta por línea. */
  tope_descuento: string | null;
  /** La promo sólo aplica si el total bruto de la venta llega a este monto. */
  monto_minimo_compra: string | null;
  metodo_pago_requerido: MetodoPagoPromo | null;
  cliente_segmento: string | null;
  requiere_cupon: boolean;
  /** Ids de sucursal. Vacío = todas. */
  sucursales: string[];
  vigente_desde: string | null;
  vigente_hasta: string | null;
  /** Ventana horaria local `"HH:mm:ss"`. `hora_desde > hora_hasta` cruza medianoche. */
  hora_desde: string | null;
  hora_hasta: string | null;
  /** Bitmask lun..dom. `null` = todos los días. */
  dias_semana: number | null;
  nxm_lleva: number | null;
  nxm_paga: number | null;
  descuento_pct: string | null;
  precio_fijo: string | null;
  cantidad_minima: string | null;
  created_at: string;
  objetivos: ObjetivoResponse[];
}

export interface CrearPromocionRequest {
  nombre: string;
  tipo: TipoPromocion;
  objetivos: ObjetivoRequest[];
  prioridad?: number;
  activo?: boolean;
  combinable?: boolean;
  tope_descuento?: number | string | null;
  monto_minimo_compra?: number | string | null;
  metodo_pago_requerido?: MetodoPagoPromo | null;
  cliente_segmento?: string | null;
  requiere_cupon?: boolean;
  /** Vacío / omitido = todas las sucursales. */
  sucursales?: string[];
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  hora_desde?: string | null;
  hora_hasta?: string | null;
  dias_semana?: number | null;
  nxm_lleva?: number | null;
  nxm_paga?: number | null;
  descuento_pct?: number | string | null;
  precio_fijo?: number | string | null;
  cantidad_minima?: number | string | null;
}

export interface ActualizarPromocionRequest {
  nombre?: string;
  tipo?: TipoPromocion;
  prioridad?: number;
  activo?: boolean;
  combinable?: boolean;
  /** objetivos, si se manda, REEMPLAZA la lista completa. */
  objetivos?: ObjetivoRequest[];
  tope_descuento?: number | string | null;
  monto_minimo_compra?: number | string | null;
  /** true ⇒ aplica `tope_descuento` + `monto_minimo_compra` (null si no van). */
  cambiar_topes?: boolean;
  metodo_pago_requerido?: MetodoPagoPromo | null;
  cliente_segmento?: string | null;
  requiere_cupon?: boolean;
  /** true ⇒ aplica `metodo_pago_requerido` + `cliente_segmento` (+ `requiere_cupon` si va). */
  cambiar_condiciones?: boolean;
  sucursales?: string[];
  /** true ⇒ reemplaza `sucursales` (lista vacía → todas). */
  cambiar_sucursales?: boolean;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  /** true ⇒ aplica `vigente_desde` + `vigente_hasta`. */
  cambiar_vigencia?: boolean;
  hora_desde?: string | null;
  hora_hasta?: string | null;
  dias_semana?: number | null;
  /** true ⇒ aplica `hora_desde` + `hora_hasta` + `dias_semana`. */
  cambiar_horario?: boolean;
  nxm_lleva?: number | null;
  nxm_paga?: number | null;
  descuento_pct?: number | string | null;
  precio_fijo?: number | string | null;
  cantidad_minima?: number | string | null;
  /** true ⇒ aplica `cantidad_minima`. */
  cambiar_cantidad_minima?: boolean;
}

export interface PromocionQuery {
  activo?: boolean | null;
  tipo?: TipoPromocion | null;
  sucursal_id?: string | null;
  q?: string | null;
  page?: number;
  page_size?: number;
  sort?: string;
}

/** Cupón que habilita una promoción `requiere_cupon = true`. Cuelga de la promo. */
export interface CuponResponse {
  codigo: string;
  promocion_id: string;
  activo: boolean;
  vigente_desde: string | null;
  vigente_hasta: string | null;
  max_usos_total: number | null;
  max_usos_por_persona: number | null;
  /** Usos ya registrados (los libera anular la venta). */
  usos?: number;
  created_at: string;
}

export interface CrearCuponRequest {
  codigo: string;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  /** `null` = sin límite. */
  max_usos_total?: number | null;
  max_usos_por_persona?: number | null;
}

export type { PaginationMeta, ApiResponse } from '@core/api.model';
