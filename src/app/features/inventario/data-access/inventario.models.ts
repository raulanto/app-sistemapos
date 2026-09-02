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
  codigo_barras?: string | null;
  nombre?: string;
  descripcion?: string | null;
  categoria_id?: string;
  unidad_medida?: string;
  precio_venta?: string;
  costo?: string;
  impuesto_tasa?: string;
  permite_stock_negativo?: boolean;
  activo?: boolean;
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