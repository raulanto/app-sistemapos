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
  categoria?: any;
  existencias?: ExistenciaResponse[] | null;
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
  include: Array<'existencias' | 'categoria'  | { type: 'existencias'; sucursal_id: string }>;
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
  cantidad: number | string;
  referencia_tipo: string;
  motivo?: string | null;
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
