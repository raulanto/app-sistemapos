export type TipoPromocion = 'nxm' | 'porcentaje' | 'precio_fijo';

export const TIPOS_PROMOCION: { value: TipoPromocion; label: string; hint: string }[] = [
  { value: 'nxm', label: 'N x M', hint: '2x1, 3x2… regala las unidades más baratas' },
  { value: 'porcentaje', label: 'Porcentaje', hint: '% de descuento sobre la línea' },
  { value: 'precio_fijo', label: 'Precio fijo', hint: 'Precio unitario forzado (solo si es menor)' },
];

export interface ObjetivoRequest {
  /** Exactamente uno de los dos. `producto_id` = venta por unidad base; `producto_unidad_id` = esa presentación. */
  producto_id?: string | null;
  producto_unidad_id?: string | null;
}

export interface ObjetivoResponse {
  id: string;
  producto_id: string | null;
  producto_unidad_id: string | null;
}

export interface PromocionResponse {
  id: string;
  nombre: string;
  tipo: TipoPromocion;
  activo: boolean;
  prioridad: number;
  sucursal_id: string | null;
  vigente_desde: string | null;
  vigente_hasta: string | null;
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
  sucursal_id?: string | null;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
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
  /** objetivos, si se manda, REEMPLAZA la lista completa. */
  objetivos?: ObjetivoRequest[];
  sucursal_id?: string | null;
  /** true + sin sucursal_id ⇒ pasa a aplicar en todas. */
  cambiar_sucursal?: boolean;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  /** true + sin fechas ⇒ promo sin límite de vigencia. */
  cambiar_vigencia?: boolean;
  nxm_lleva?: number | null;
  nxm_paga?: number | null;
  descuento_pct?: number | string | null;
  precio_fijo?: number | string | null;
  cantidad_minima?: number | string | null;
  /** true + sin cantidad_minima ⇒ quita el umbral. */
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
