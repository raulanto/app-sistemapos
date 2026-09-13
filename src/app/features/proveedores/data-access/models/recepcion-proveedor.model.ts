export type EstadoRecepcion = 'completa' | 'parcial' | 'con_defectos';
export const ESTADOS_RECEPCION: { value: EstadoRecepcion; label: string }[] = [
  { value: 'completa', label: 'Completa' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'con_defectos', label: 'Con defectos' },
];

export type MotivoDefecto = 'danado' | 'caducado' | 'incompleto' | 'error_proveedor' | 'otro';
export const MOTIVOS_DEFECTO: { value: MotivoDefecto; label: string }[] = [
  { value: 'danado', label: 'Dañado' },
  { value: 'caducado', label: 'Caducado' },
  { value: 'incompleto', label: 'Incompleto' },
  { value: 'error_proveedor', label: 'Error del proveedor' },
  { value: 'otro', label: 'Otro' },
];

export type AccionDefecto = 'devolucion' | 'merma' | 'aceptado_con_descuento';
export const ACCIONES_DEFECTO: { value: AccionDefecto; label: string }[] = [
  { value: 'devolucion', label: 'Devolver al proveedor' },
  { value: 'merma', label: 'Dar de baja (merma)' },
  { value: 'aceptado_con_descuento', label: 'Aceptar con descuento' },
];

export interface RecepcionProveedorLineaResponse {
  id: string;
  producto_id: string;
  cantidad_esperada: string | null;
  cantidad_recibida_buena: string;
  cantidad_defectuosa: string;
  motivo_defecto: MotivoDefecto | null;
  accion_defecto: AccionDefecto | null;
  fotos_evidencia_keys: string[];
  notas: string | null;
}

export interface RecepcionProveedorResponse {
  id: string;
  folio: string;
  pedido_id: string | null;
  proveedor_id: string;
  sucursal_id: string;
  numero_factura: string | null;
  numero_remision: string | null;
  transportista: string | null;
  recibido_por: string;
  fecha_recepcion: string;
  estado: EstadoRecepcion;
  notas: string | null;
  created_at: string;
  lineas: RecepcionProveedorLineaResponse[];
}

export interface LineaRecepcionRequest {
  producto_id: string;
  cantidad_recibida_buena: number;
  cantidad_defectuosa?: number;
  cantidad_esperada?: number | null;
  motivo_defecto?: MotivoDefecto | null;
  accion_defecto?: AccionDefecto | null;
  notas?: string | null;
}

export interface RecepcionProveedorCreateRequest {
  proveedor_id: string;
  lineas: LineaRecepcionRequest[];
  pedido_id?: string | null;
  numero_factura?: string | null;
  numero_remision?: string | null;
  transportista?: string | null;
  notas?: string | null;
}

export interface RecepcionProveedorQuery {
  proveedor_id?: string | null;
  sucursal_id?: string | null;
  pedido_id?: string | null;
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: fecha_recepcion. */
  sort?: string;
}
