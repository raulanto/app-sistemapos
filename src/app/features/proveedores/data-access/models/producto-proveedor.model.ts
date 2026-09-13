/** Vínculo producto↔proveedor (cuelga de `/api/v1/inventario/productos/{producto_id}/proveedores`). */
export interface ProductoProveedorResponse {
  id: string;
  producto_id: string;
  proveedor_id: string;
  codigo_proveedor: string | null;
  precio_compra: string;
  tiempo_entrega_dias: number;
  stock_minimo: string;
  stock_maximo: string | null;
  cantidad_reorden: string;
  es_proveedor_principal: boolean;
  activo: boolean;
  created_at: string;
}

export interface ProductoProveedorCreateRequest {
  proveedor_id: string;
  precio_compra: number;
  tiempo_entrega_dias: number;
  stock_minimo: number;
  cantidad_reorden: number;
  codigo_proveedor?: string | null;
  stock_maximo?: number | null;
  es_proveedor_principal?: boolean;
}
