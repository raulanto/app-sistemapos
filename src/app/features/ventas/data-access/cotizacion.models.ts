import { LineaVentaRequest, PromoAplicada } from './venta.models';

/** El cuerpo usa las mismas líneas que la venta (`LineaVentaRequest`). */
export interface CotizarVentaRequest {
  descuento_total?: number | string;
  lineas: LineaVentaRequest[];
  /** Hint: métodos de pago previstos, para ver promos por método de pago. */
  metodos_pago?: string[];
  /** Hint: segmento del cliente, para ver promos por segmento. */
  cliente_segmento?: string | null;
  /** Hint: código de cupón, para ver la promo que habilita. */
  codigo_cupon?: string | null;
  /** Hint: teléfono, para ver el cashback a generar. */
  telefono?: string | null;
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
  /** Desglose: una fila por promo aplicada a la línea. */
  promos_aplicadas?: PromoAplicada[];
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
  /** Cashback que generaría esta venta si se cobra con un teléfono. */
  monedero_a_generar?: string;
}

/** `POST /ventas/cupon/validar` — preview, no consume nada. */
export interface ValidarCuponResponse {
  promocion_id: string;
  valido: boolean;
}
