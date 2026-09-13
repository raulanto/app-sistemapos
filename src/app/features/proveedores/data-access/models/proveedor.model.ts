export type TipoPersona = 'fisica' | 'moral';
export const TIPOS_PERSONA: { value: TipoPersona; label: string }[] = [
  { value: 'fisica', label: 'Persona física' },
  { value: 'moral', label: 'Persona moral' },
];

export type CondicionesPago = 'contado' | 'credito';
export const CONDICIONES_PAGO: { value: CondicionesPago; label: string }[] = [
  { value: 'contado', label: 'Contado' },
  { value: 'credito', label: 'Crédito' },
];

export interface ProveedorResponse {
  id: string;
  codigo: string;
  razon_social: string;
  nombre_comercial: string | null;
  rfc: string | null;
  tipo_persona: TipoPersona;
  condiciones_pago: CondicionesPago;
  dias_credito: number | null;
  moneda: string;
  contacto_principal: string | null;
  telefono: string | null;
  email: string | null;
  direccion_calle: string | null;
  direccion_numero: string | null;
  direccion_colonia: string | null;
  direccion_ciudad: string | null;
  direccion_estado: string | null;
  direccion_codigo_postal: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
}

export interface ProveedorCreateRequest {
  codigo: string;
  razon_social: string;
  tipo_persona: TipoPersona;
  condiciones_pago: CondicionesPago;
  dias_credito?: number | null;
  nombre_comercial?: string | null;
  rfc?: string | null;
  moneda?: string;
  contacto_principal?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion_calle?: string | null;
  direccion_numero?: string | null;
  direccion_colonia?: string | null;
  direccion_ciudad?: string | null;
  direccion_estado?: string | null;
  direccion_codigo_postal?: string | null;
  notas?: string | null;
}

/** `cambiar_<campo>` es el flag "sí lo toqué" — sin él el backend ignora el campo aunque venga null. */
export interface ProveedorUpdateRequest {
  razon_social?: string | null;
  tipo_persona?: TipoPersona | null;
  condiciones_pago?: CondicionesPago | null;
  dias_credito?: number | null;
  cambiar_dias_credito?: boolean;
  moneda?: string | null;
  nombre_comercial?: string | null;
  cambiar_nombre_comercial?: boolean;
  rfc?: string | null;
  cambiar_rfc?: boolean;
  contacto_principal?: string | null;
  cambiar_contacto_principal?: boolean;
  telefono?: string | null;
  cambiar_telefono?: boolean;
  email?: string | null;
  cambiar_email?: boolean;
  notas?: string | null;
  cambiar_notas?: boolean;
  direccion_calle?: string | null;
  direccion_numero?: string | null;
  direccion_colonia?: string | null;
  direccion_ciudad?: string | null;
  direccion_estado?: string | null;
  direccion_codigo_postal?: string | null;
}

export interface ProveedorQuery {
  activo?: boolean | null;
  q?: string | null;
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: codigo, razon_social. */
  sort?: string;
}

export interface ResumenProveedorResponse {
  proveedor_id: string;
  total_unidades_recibidas: string;
  total_unidades_defectuosas: string;
  pct_defectuoso: string;
  tiempo_entrega_prometido_dias: string | null;
  tiempo_entrega_real_promedio_dias: string | null;
  devoluciones_pendientes: number;
  devoluciones_aceptadas: number;
  devoluciones_rechazadas: number;
}

const MENSAJES_ERROR_PROVEEDOR: Record<string, string> = {
  DiasCreditoRequerido: 'Con condición de pago "crédito" debes capturar los días de crédito (mayor a 0).',
  PedidoProveedorSinLineas: 'El pedido no tiene líneas.',
  PedidoNoEditable: 'Ese pedido ya no está en borrador: no se le pueden agregar líneas.',
  TransicionPedidoProveedorInvalida: 'Ese cambio de estado no está permitido para el pedido ahora.',
  RecepcionSinLineas: 'La recepción no tiene líneas.',
  DefectoInvalido: 'Si hay cantidad defectuosa, captura motivo y acción del defecto (y viceversa).',
  CantidadDevolucionExcedeDefecto: 'Estás devolviendo más de lo defectuoso disponible en esa línea.',
  TransicionDevolucionInvalida: 'Ese cambio de estado no está permitido para la devolución ahora.',
  CodigoProveedorEnUso: 'Ya existe un proveedor activo con ese código.',
  ProductoProveedorYaExiste: 'Ese producto ya tiene un vínculo activo con ese proveedor.',
  YaHayProveedorPrincipal: 'Otro proveedor ya es el principal (activo) de ese producto.',
  ProveedorNoEncontrado: 'El proveedor no existe.',
  ProductoProveedorNoEncontrado: 'Ese vínculo producto-proveedor no existe.',
  PedidoProveedorNoEncontrado: 'El pedido no existe.',
  RecepcionProveedorNoEncontrada: 'La recepción no existe.',
  DevolucionProveedorNoEncontrada: 'La devolución no existe.',
};

/**
 * Traduce el error del backend (Parte 8 de la guía) a un mensaje accionable.
 * Igual que en `agenda`/`pedidos`: el backend suele mandar `code: "BAD_REQUEST"` genérico
 * con el detalle real sólo en `message` — el mapa por código es respaldo.
 */
export function mensajeProveedorError(err: unknown, fallback: string): string {
  const e = err as { error?: { error?: { code?: string; message?: string } } };
  const code = e?.error?.error?.code;
  const raw = e?.error?.error?.message;
  if (code && code !== 'BAD_REQUEST' && MENSAJES_ERROR_PROVEEDOR[code]) return MENSAJES_ERROR_PROVEEDOR[code];
  return raw || fallback;
}
