export type EstadoDevolucionProveedor = 'pendiente' | 'enviada' | 'cerrada';
export const ESTADOS_DEVOLUCION_PROVEEDOR: { value: EstadoDevolucionProveedor; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'cerrada', label: 'Cerrada' },
];

export type ResultadoDevolucion = 'aceptada_proveedor' | 'rechazada_proveedor';
export const RESULTADOS_DEVOLUCION: { value: ResultadoDevolucion; label: string }[] = [
  { value: 'aceptada_proveedor', label: 'Aceptada por el proveedor' },
  { value: 'rechazada_proveedor', label: 'Rechazada por el proveedor' },
];

export type TipoResolucionDevolucion = 'reemplazo' | 'nota_credito' | 'reembolso';
export const TIPOS_RESOLUCION_DEVOLUCION: { value: TipoResolucionDevolucion; label: string }[] = [
  { value: 'reemplazo', label: 'Reemplazo' },
  { value: 'nota_credito', label: 'Nota de crédito' },
  { value: 'reembolso', label: 'Reembolso' },
];

export interface DevolucionProveedorLineaResponse {
  id: string;
  recepcion_detalle_id: string;
  producto_id: string;
  cantidad: string;
}

export interface DevolucionProveedorResponse {
  id: string;
  folio: string;
  proveedor_id: string;
  recepcion_id: string;
  creado_por: string;
  estado: EstadoDevolucionProveedor;
  resultado: ResultadoDevolucion | null;
  tipo_resolucion: TipoResolucionDevolucion | null;
  fecha_envio: string | null;
  fecha_cierre: string | null;
  notas: string | null;
  created_at: string;
  lineas: DevolucionProveedorLineaResponse[];
}

export interface LineaDevolucionRequest {
  recepcion_detalle_id: string;
  cantidad: number;
}

export interface DevolucionProveedorCreateRequest {
  proveedor_id: string;
  recepcion_id: string;
  lineas: LineaDevolucionRequest[];
  notas?: string | null;
}

export interface CerrarDevolucionRequest {
  resultado: ResultadoDevolucion;
  tipo_resolucion?: TipoResolucionDevolucion | null;
}

export interface DevolucionProveedorQuery {
  proveedor_id?: string | null;
  estado?: EstadoDevolucionProveedor | null;
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: created_at. */
  sort?: string;
}
