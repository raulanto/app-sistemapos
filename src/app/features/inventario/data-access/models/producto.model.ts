import type { ComponenteResponse } from './componente.model';
import type { ExistenciaResponse } from './existencia.model';
import type { ImagenResponse } from './imagen.model';
import type { UnidadResponse } from './unidad.model';

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
  /** Monedero (cashback): % del subtotal por línea al vender con teléfono. Si null, se usa `monedero_monto`. */
  monedero_pct?: string | null;
  /** Monedero: monto fijo por unidad. Ambos null = el producto no genera cashback. */
  monedero_monto?: string | null;
  activo: boolean;
  tipo?: TipoProducto;
  categoria?: any;
  existencias?: ExistenciaResponse[] | null;
  componentes?: ComponenteResponse[] | null;
  unidades?: UnidadResponse[] | null;
  /** Portada derivada de la imagen con `es_principal` (llega siempre, sin `include`). */
  imagen_principal?: ImagenResponse | null;
  /** Galería de imágenes (llega con `?include=imagenes`). */
  imagenes?: ImagenResponse[] | null;
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
  /** Monedero (cashback): `monedero_pct` (0-100) tiene prioridad; si no, `monedero_monto` fijo por unidad. */
  monedero_pct?: number | string | null;
  monedero_monto?: number | string | null;
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
  monedero_pct?: number | string | null;
  monedero_monto?: number | string | null;
  /** Con el flag en true, mandar `monedero_pct`/`monedero_monto` null limpia el monedero. */
  cambiar_monedero?: boolean;
  codigo_barras?: string | null;
  cambiar_codigo_barras?: boolean;
  cambiar_descripcion?: boolean;
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
