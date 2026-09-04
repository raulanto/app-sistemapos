export interface ProductoResponse {
  id: string;
  sku: string;
  codigo_barras?: string | null;
  nombre: string;
  descripcion?: string | null;
  categoria_id: string;
  unidad_medida: string;
  precio_venta: string;
  costo: string;
  impuesto_tasa: string;
  permite_stock_negativo: boolean;
  activo: boolean;
  tipo?: 'simple' | 'kit'; // Added tipo
  categoria?: any;
  existencias?: ExistenciaResponse[] | null;
  componentes?: ComponenteResponse[] | null; // Added componentes
  unidades?: UnidadResponse[] | null; // Added unidades
}

export interface ComponenteResponse {
  producto_kit_id: string;
  producto_componente_id: string;
  cantidad: string;
  componente?: ProductoResponse; // Embebido opcional
}

export interface AgregarComponenteRequest {
  producto_componente_id: string;
  cantidad: number | string;
}

export interface ActualizarComponenteRequest {
  cantidad: number | string;
}

export interface UnidadResponse {
  id: string;
  producto_id: string;
  nombre: string;
  /** Unidad de medida propia de la presentación (ej. "pieza", "litro"). 1-20 chars. */
  unidad_medida: string;
  /** Unidades base del producto padre por 1 de esta presentación (precisión 6). */
  factor: string;
  /** Recíproco: cuántas de esta presentación entran en 1 unidad base. Puede venir null. */
  unidades_por_base?: string | null;
  precio_venta: string;
  codigo_barras?: string | null;
  activo: boolean;
  producto?: ProductoResponse;
}

/**
 * Equivalencia: enviar EXACTAMENTE uno de `factor` o `unidades_por_base`.
 * - `factor`: unidades base por 1 presentación (Reja x24 sobre base "lata" => 24).
 * - `unidades_por_base`: su recíproco (reja de 6 latas, presentación "lata" => 6).
 * El backend siempre persiste `factor` (unidades_por_base 6 => 0.166667).
 */
export interface AgregarUnidadRequest {
  nombre: string;
  unidad_medida: string;
  precio_venta: number | string;
  factor?: number | string | null;
  unidades_por_base?: number | string | null;
  codigo_barras?: string | null;
}

export interface ActualizarUnidadRequest {
  nombre?: string;
  unidad_medida?: string;
  factor?: number | string | null;
  unidades_por_base?: number | string | null;
  precio_venta?: number | string;
  codigo_barras?: string | null;
  cambiar_codigo_barras?: boolean;
  activo?: boolean;
}

/** Resultado de POS al escanear un código de barras (producto o presentación). */
export interface ResolucionCodigoResponse {
  producto_id: string;
  unidad_id?: string | null;
  nombre_unidad: string;
  unidad_medida: string;
  factor: string;
  precio_venta: string;
}

export interface CrearProductoRequest {
  sku: string;
  codigo_barras?: string | null;
  nombre: string;
  descripcion?: string | null;
  categoria_id: string;
  unidad_medida: string;
  precio_venta: string;
  costo: string;
  impuesto_tasa: string;
  permite_stock_negativo: boolean;
  tipo?: 'SIMPLE' | 'KIT';
  activo?: boolean;
}

export interface ActualizarProductoRequest {
  sku?: string;
  nombre?: string;
  descripcion?: string | null;
  categoria_id?: string;
  unidad_medida?: string;
  precio_venta?: string | number;
  costo?: string | number;
  impuesto_tasa?: string | number;
  tipo?: string;
  permite_stock_negativo?: boolean;
  codigo_barras?: string | null;
  cambiar_codigo_barras?: boolean;
  cambiar_descripcion?: boolean;
}

export interface CategoriaResponse {
  id: string;
  nombre: string;
  categoria_padre_id?: string | null;
  activo: boolean;
  padre?: any;
}

export interface CrearCategoriaRequest {
  nombre: string;
  categoria_padre_id?: string | null;
  activo?: boolean;
}

export interface ActualizarCategoriaRequest {
  nombre?: string;
  categoria_padre_id?: string | null;
  activo?: boolean;
}

export interface TipoMovimiento {
  // Define enum based on OpenAPI values, assuming common inventory types
  // e.g. ENTRADA_COMPRA, SALIDA_VENTA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO
  [key: string]: any; 
}

export interface MovimientoResponse {
  id: string;
  producto_id: string;
  sucursal_id: string;
  tipo: TipoMovimiento | string;
  cantidad: string;
  costo_unitario?: string | null;
  referencia_tipo: string;
  referencia_id?: string | null;
  usuario_id: string;
  motivo?: string | null;
  created_at: string;
  producto?: any;
  usuario?: any;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProductoQuery {
  categoria_id?: string[] | null;
  activo?: boolean | null;
  q?: string | null;
  sucursal_id?: string[] | null;
  page?: number;
  page_size?: number;
  sort?: string;
  include?: Array<'existencias' | 'categoria' | 'componentes' | { type: 'existencias'; sucursal_id: string }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    sort?: string;
    filters?: any;
    summary?: any;
  };
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}


export interface ExistenciaResponse {
  id: string;
  producto_id: string;
  sucursal_id: string;
  cantidad: string;
  stock_minimo?: string | null;
}

export interface AplicarMovimientoRequest {
  producto_id: string;
  tipo: string;
  sucursal_id: string;
  cantidad?: number | string | null;
  /** Alternativa a `cantidad`: fija el saldo resultante (ajustes por conteo). */
  cantidad_final?: number | string | null;
  referencia_tipo: string;
  referencia_id?: string | null;
  motivo?: string | null;
  costo_unitario?: number | string | null;
  stock_minimo?: number | string | null;
  stock_maximo?: number | string | null;
  /**
   * Solo en `entrada` con `costo_unitario`: hace `producto.costo = costo_unitario`
   * dentro de la misma transacción. 400 si falta costo_unitario o el tipo no es entrada.
   */
  actualizar_costo?: boolean;
  /** Fija `producto.precio_venta` en cualquier tipo de movimiento. >= 0. */
  nuevo_precio_venta?: number | string | null;
}
export interface TransferenciaRequest {
  producto_id: string;
  sucursal_origen_id: string;
  sucursal_destino_id: string;
  cantidad: number | string;
  referencia_id?: string | null;
  motivo?: string | null;
}

export interface ProductoKpiResponse {
  total: number;
  activos: number;
  inactivos: number;
  por_tipo: Record<string, number>;
  con_codigo_barras: number;
  sin_codigo_barras: number;
  categorias_distintas: number;
  precio_venta_min: string | null;
  precio_venta_max: string | null;
  precio_venta_promedio: string | null;
  costo_min: string | null;
  costo_max: string | null;
  costo_promedio: string | null;
  margen_promedio: string | null;
  unidades_en_stock: string | null;
  valor_inventario_costo: string | null;
  valor_inventario_venta: string | null;
  productos_con_existencia: number;
  productos_sin_existencia: number;
  bajo_stock: number;
}
