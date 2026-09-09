import type { ImagenResponse } from './imagen.model';
import type { ProductoResponse } from './producto.model';

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
  /** Monedero propio de la presentación; si está definido, sobreescribe al del producto. */
  monedero_pct?: string | null;
  monedero_monto?: string | null;
  activo: boolean;
  producto?: ProductoResponse;
  /** Portada de la presentación (llega con `?include=unidades`, mismo formato que la del producto). */
  imagen_principal?: ImagenResponse | null;
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
  /** Monedero propio de la presentación (sobreescribe al del producto). `pct` 0-100 tiene prioridad. */
  monedero_pct?: number | string | null;
  monedero_monto?: number | string | null;
}

export interface ActualizarUnidadRequest {
  nombre?: string;
  unidad_medida?: string;
  factor?: number | string | null;
  unidades_por_base?: number | string | null;
  precio_venta?: number | string;
  codigo_barras?: string | null;
  cambiar_codigo_barras?: boolean;
  monedero_pct?: number | string | null;
  monedero_monto?: number | string | null;
  /** Con el flag en true, mandar `monedero_pct`/`monedero_monto` null limpia el monedero de la presentación. */
  cambiar_monedero?: boolean;
}
