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
