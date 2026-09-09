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
