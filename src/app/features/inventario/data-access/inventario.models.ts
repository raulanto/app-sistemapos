/** `simple`: normal. `fraccionable`: se vende en incrementos parciales de la unidad base.
 *  `kit`: se arma con otros productos (receta). `servicio`: no mueve inventario (flete, mano de obra). */
export type TipoProducto = 'simple' | 'fraccionable' | 'kit' | 'servicio';

export interface ProductoResponse {
  id: string;
  sku: string;
  codigo_barras?: string | null;
  nombre: string;
  descripcion?: string | null;
  categoria_id: string;
  unidad_medida: string;
  /** FK opcional al catálogo de unidades de medida (define decimales para redondeo de stock). */
  unidad_medida_id?: string | null;
  precio_venta: string;
  costo: string;
  impuesto_tasa: string;
  permite_stock_negativo: boolean;
  /** Si se puede vender cantidad no entera de la unidad base. `tipo: 'fraccionable'` la fuerza a true. */
  permite_venta_fraccionada: boolean;
  /** Si está definido, toda venta/salida debe ser múltiplo exacto de este valor. */
  incremento_minimo_venta?: string | null;
  /** Control por lote: ENTRADA exige lote, SALIDA descuenta por FEFO. No se puede activar con stock. */
  requiere_lote?: boolean;
  /** Rastreo de envases abiertos (venta a granel). Requiere `instancia_capacidad_default`. */
  rastrea_instancia_abierta?: boolean;
  instancia_capacidad_default?: string | null;
  /** `precio_venta` ya incluye el IVA (precio final al público). Informativo para front/reportes. */
  precio_incluye_impuesto?: boolean;
  /** Precio alternativo a partir de `cantidad_minima_mayoreo` (ambos o ninguno). */
  precio_mayoreo?: string | null;
  cantidad_minima_mayoreo?: string | null;
  /** No se mantiene en stock; se vende sin existencia. */
  es_sobre_pedido?: boolean;
  activo: boolean;
  tipo?: TipoProducto;
  categoria?: any;
  existencias?: ExistenciaResponse[] | null;
  componentes?: ComponenteResponse[] | null; // Added componentes
  unidades?: UnidadResponse[] | null; // Added unidades
  /** Portada derivada de la imagen con `es_principal` (llega siempre, sin `include`). */
  imagen_principal?: ImagenResponse | null;
  /** Galería de imágenes (llega con `?include=imagenes`). */
  imagenes?: ImagenResponse[] | null;
}

/**
 * Imagen de la galería de un producto o de una presentación.
 * Si vive en S3 (`object_key` presente), `url`/`thumbnail_url` salen PREFIRMADAS
 * y expiran (~1 h): hay que volver a pedir el GET para refrescarlas.
 * Si es una URL externa (flujo viejo), `url` va tal cual y `thumbnail_url` es null.
 */
export interface ImagenResponse {
  id: string;
  producto_id?: string | null;
  producto_unidad_id?: string | null;
  url?: string | null;
  /** Miniatura 400×400. Puede dar 404 ~1-2 s tras subir, hasta que la Lambda la genera. */
  thumbnail_url?: string | null;
  /** Identificador estable del objeto en S3. null en imágenes por URL externa. */
  object_key?: string | null;
  alt_texto?: string | null;
  orden: number;
  es_principal: boolean;
}

export interface AgregarImagenRequest {
  /** URL absoluta (http/https), máx. 2083 caracteres. Solo para imágenes hospedadas por terceros. */
  url: string;
  alt_texto?: string | null;
  orden?: number;
  /** Solo puede haber una principal: marcar otra desmarca la anterior. */
  es_principal?: boolean;
}

/** Cuerpo multipart/form-data para `POST .../imagenes/upload`. */
export interface SubirImagenRequest {
  file: File;
  alt_texto?: string | null;
  orden?: number;
  es_principal?: boolean;
}

/** MIME types aceptados por el backend para subir imágenes. */
export const IMAGEN_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** Tamaño máximo por imagen (5 MiB, espejo de `IMAGEN_MAX_BYTES` del backend). */
export const IMAGEN_MAX_BYTES = 5 * 1024 * 1024;

export interface ActualizarImagenRequest {
  url?: string | null;
  alt_texto?: string | null;
  /** Sin este flag, `alt_texto` null significa "no tocar"; con el flag, null lo borra. */
  cambiar_alt_texto?: boolean;
  orden?: number | null;
  es_principal?: boolean | null;
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

/** Reemplaza la receta completa de un kit en una sola llamada (PUT /componentes). */
export interface ReemplazarRecetaRequest {
  componentes: Array<{ producto_componente_id: string; cantidad: number | string }>;
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
}

export type TipoMagnitud = 'conteo' | 'masa' | 'volumen' | 'longitud' | 'tiempo';

/** Catálogo de unidades de medida (kg, l, ml, pza, reja, hora, …). */
export interface UnidadMedidaResponse {
  id: string;
  codigo: string;
  nombre: string;
  tipo_magnitud: TipoMagnitud;
  decimales: number;
  activo: boolean;
}

export interface CrearUnidadMedidaRequest {
  codigo: string;
  nombre: string;
  tipo_magnitud: TipoMagnitud;
  decimales?: number;
}

export interface ActualizarUnidadMedidaRequest {
  nombre?: string;
  tipo_magnitud?: TipoMagnitud;
  decimales?: number;
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
  /** FK opcional al catálogo (GET /inventario/unidades-medida). Si se omite, sigue funcionando con el string libre. */
  unidad_medida_id?: string | null;
  precio_venta: string | number;
  costo: string | number;
  impuesto_tasa: string | number;
  permite_stock_negativo: boolean;
  /** `tipo: 'fraccionable'` ya la fuerza a true en el backend; no hace falta mandarla aparte en ese caso. */
  permite_venta_fraccionada?: boolean;
  /** Si se define, toda venta/salida debe ser múltiplo exacto de este valor. */
  incremento_minimo_venta?: number | string | null;
  /** Control por lote (no se puede activar después con stock cargado). */
  requiere_lote?: boolean;
  rastrea_instancia_abierta?: boolean;
  instancia_capacidad_default?: number | string | null;
  precio_incluye_impuesto?: boolean;
  /** `precio_mayoreo` y `cantidad_minima_mayoreo` van juntos (ambos o ninguno). */
  precio_mayoreo?: number | string | null;
  cantidad_minima_mayoreo?: number | string | null;
  es_sobre_pedido?: boolean;
  tipo?: TipoProducto;
  activo?: boolean;
}

export interface ActualizarProductoRequest {
  sku?: string;
  nombre?: string;
  descripcion?: string | null;
  categoria_id?: string;
  unidad_medida?: string;
  unidad_medida_id?: string | null;
  /** Sin este flag, un `unidad_medida_id` null significa "no tocar"; con el flag en true, null sí lo borra. */
  cambiar_unidad_medida_id?: boolean;
  precio_venta?: string | number;
  costo?: string | number;
  impuesto_tasa?: string | number;
  tipo?: TipoProducto;
  permite_stock_negativo?: boolean;
  permite_venta_fraccionada?: boolean;
  incremento_minimo_venta?: number | string | null;
  /** Mismo patrón que `cambiar_descripcion`/`cambiar_codigo_barras`. */
  cambiar_incremento_minimo_venta?: boolean;
  requiere_lote?: boolean | null;
  rastrea_instancia_abierta?: boolean | null;
  instancia_capacidad_default?: number | string | null;
  /** Con el flag en true, `instancia_capacidad_default: null` sí lo borra. */
  cambiar_instancia_capacidad_default?: boolean;
  precio_incluye_impuesto?: boolean | null;
  es_sobre_pedido?: boolean | null;
  precio_mayoreo?: number | string | null;
  cantidad_minima_mayoreo?: number | string | null;
  /** Con el flag en true, mandar `precio_mayoreo`/`cantidad_minima_mayoreo` null los borra (van juntos). */
  cambiar_mayoreo?: boolean;
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
}

export interface ActualizarCategoriaRequest {
  nombre?: string;
  categoria_padre_id?: string | null;
  /** Sin el flag, `categoria_padre_id` null = "no tocar"; con el flag, null la vuelve raíz. */
  cambiar_padre?: boolean;
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
  include?: Array<'existencias' | 'categoria' | 'componentes' | 'unidades' | 'imagenes' | { type: 'existencias'; sucursal_id: string }>;
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
  stock_maximo?: string | null;
  updated_at?: string;
}

/**
 * Saldo de stock traducido a cada presentación activa.
 * `GET /inventario/productos/{id}/existencias?sucursal_id=` (multi).
 * Ej. base "reja", presentación "botella" con factor 0.125 (8 botellas = 1 reja):
 * 8.875 rejas → 71 botellas (`cantidad_entera`), la reja aparece con `cantidad_entera: 8` + fracción.
 */
export interface PresentacionDesglose {
  /** null = unidad base del producto. */
  producto_unidad_id: string | null;
  nombre: string;
  unidad_medida?: string | null;
  /** Unidades base por 1 de esta presentación (base ⇒ 1). */
  factor: string;
  /** Saldo exacto en esta presentación (`cantidad_base / factor`). */
  cantidad: string;
  /** Unidades completas disponibles. */
  cantidad_entera: number;
}

export interface SucursalDesglose {
  sucursal_id: string;
  cantidad_base: string;
  stock_minimo?: string | null;
  stock_maximo?: string | null;
  presentaciones: PresentacionDesglose[];
}

export interface DesgloseExistenciasResponse {
  producto_id: string;
  unidad_base?: string | null;
  /** Saldo total (todas las sucursales) en unidad base. */
  cantidad_base_global: string;
  /** Desglose sumado de todas las sucursales. */
  presentaciones_global: PresentacionDesglose[];
  por_sucursal: SucursalDesglose[];
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
