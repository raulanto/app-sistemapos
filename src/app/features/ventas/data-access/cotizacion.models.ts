import { LineaVentaRequest } from './venta.models';

/** El cuerpo usa las mismas líneas que la venta (`LineaVentaRequest`). */
export interface CotizarVentaRequest {
  descuento_total?: number | string;
  lineas: LineaVentaRequest[];
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
