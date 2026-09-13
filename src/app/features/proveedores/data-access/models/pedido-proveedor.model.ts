export type EstadoPedidoProveedor = 'borrador' | 'enviado' | 'confirmado' | 'parcial' | 'recibido' | 'cancelado';

export const ESTADOS_PEDIDO_PROVEEDOR: { value: EstadoPedidoProveedor; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'cancelado', label: 'Cancelado' },
];

export interface PedidoProveedorLineaResponse {
  id: string;
  producto_id: string;
  cantidad_solicitada: string;
  cantidad_recibida: string;
  precio_unitario: string;
  subtotal: string;
  pendiente: string;
}

export interface PedidoProveedorResponse {
  id: string;
  folio: string;
  proveedor_id: string;
  sucursal_id: string;
  estado: EstadoPedidoProveedor;
  generado_automaticamente: boolean;
  generado_por: string | null;
  confirmado_por: string | null;
  fecha_pedido: string;
  fecha_estimada_entrega: string | null;
  subtotal: string;
  notas: string | null;
  created_at: string;
  lineas: PedidoProveedorLineaResponse[];
}

export interface LineaPedidoProveedorRequest {
  producto_id: string;
  cantidad_solicitada: number;
  precio_unitario: number;
}

export interface PedidoProveedorCreateRequest {
  proveedor_id: string;
  lineas: LineaPedidoProveedorRequest[];
  fecha_estimada_entrega?: string | null;
  notas?: string | null;
}

export interface PedidoProveedorQuery {
  proveedor_id?: string | null;
  sucursal_id?: string | null;
  estado?: EstadoPedidoProveedor | null;
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: fecha_pedido. */
  sort?: string;
}

/** Resultado de `POST /proveedores/reorden/evaluar`: uno por cada proveedor con algo por debajo del mínimo. */
export interface ReordenGeneradoResponse {
  pedido: PedidoProveedorResponse;
  fue_creado: boolean;
}
