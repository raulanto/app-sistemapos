import type { MetodoPago, PagoRequest, VentaResponse } from '@/features/ventas/data-access/ventas.models';

export type { MetodoPago, PagoRequest, VentaResponse };

export type TipoPedido = 'mostrador' | 'domicilio' | 'recoger';
export type CanalPedido = 'pos' | 'web' | 'telefono';
export type EstadoPedido = 'borrador' | 'confirmado' | 'facturado' | 'cancelado';
export type EstadoEntrega = 'pendiente' | 'en_preparacion' | 'en_reparto' | 'entregado' | 'fallido';

export const TIPOS_PEDIDO: { value: TipoPedido; label: string; hint: string }[] = [
  { value: 'mostrador', label: 'Mostrador', hint: 'Sin entrega: el cliente retira en el momento' },
  { value: 'domicilio', label: 'Domicilio', hint: 'Con dirección y reparto' },
  { value: 'recoger', label: 'Para recoger', hint: 'El cliente pasa por él (sin reparto)' },
];

export const CANALES_PEDIDO: { value: CanalPedido; label: string }[] = [
  { value: 'pos', label: 'POS' },
  { value: 'web', label: 'Web' },
  { value: 'telefono', label: 'Teléfono' },
];

export const ESTADOS_PEDIDO: { value: EstadoPedido; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'facturado', label: 'Facturado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const ESTADOS_ENTREGA: { value: EstadoEntrega; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'en_reparto', label: 'En reparto' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'fallido', label: 'Fallido' },
];

/** Métodos con los que se puede registrar un anticipo (todos los de venta menos crédito). */
export const METODOS_ANTICIPO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_debito', label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'monedero', label: 'Monedero' },
];

/**
 * Siguientes `estado_entrega` válidos desde el actual (ver diagrama de la guía).
 * `recoger` no usa `en_reparto`.
 */
export function siguientesEstadosEntrega(actual: EstadoEntrega | null, tipo: TipoPedido): EstadoEntrega[] {
  const conReparto = tipo === 'domicilio';
  switch (actual) {
    case 'pendiente':
      return ['en_preparacion'];
    case 'en_preparacion':
      return conReparto ? ['en_reparto', 'fallido'] : ['entregado', 'fallido'];
    case 'en_reparto':
      return ['entregado', 'fallido'];
    case 'fallido':
      return conReparto ? ['en_preparacion', 'en_reparto'] : ['en_preparacion'];
    default:
      return [];
  }
}

/**
 * Traduce los mensajes crudos del backend de pedidos a algo accionable.
 * El backend manda estos como `code: "BAD_REQUEST"` con el detalle sólo en `message`
 * (y a veces filtra nombres de columnas), así que se detectan por texto.
 */
export function mensajePedidoError(raw: string | null | undefined, fallback: string): string {
  const m = (raw ?? '').toLowerCase();
  if (m.includes('serviciosinresponsable') || m.includes('sin responsable') || m.includes('asignado_a')) {
    return 'Asigna un responsable a cada línea de servicio (envío, instalación…) antes de confirmar el pedido.';
  }
  if (m.includes('direccionenvio') || m.includes('direccion_texto') || m.includes('domicilio')) {
    return 'El pedido a domicilio no tiene dirección. Edítalo y captúrala antes de continuar.';
  }
  if (m.includes('responsableinvalido')) {
    return 'El responsable elegido no es un usuario activo, o esa línea no es un servicio.';
  }
  if (m.includes('stockinsuficiente')) {
    return 'No hay stock suficiente para una de las líneas. El pedido sigue confirmado; reintenta cuando repongas.';
  }
  return raw || fallback;
}

export interface LineaPedidoRequest {
  producto_id: string;
  cantidad: number | string;
  precio_unitario: number | string;
  descuento_linea?: number | string;
  impuesto_tasa?: number | string;
  /** null = unidad base; con id se cotiza esa presentación. */
  producto_unidad_id?: string | null;
  /**
   * Responsable de una línea de servicio (envío, instalación…). Obligatorio para
   * confirmar el pedido; se ignora en líneas que no son de tipo `servicio`.
   */
  asignado_a?: string | null;
}

export interface CrearPedidoRequest {
  tipo: TipoPedido;
  canal?: CanalPedido;
  lineas: LineaPedidoRequest[];
  cliente_id?: string | null;
  telefono?: string | null;
  descuento_total?: number | string;
  /** Obligatorio si `descuento_total` > 0. */
  motivo_descuento?: string | null;
  codigo_cupon?: string | null;
  cliente_segmento?: string | null;
  notas?: string | null;
  /** ISO date-time. */
  fecha_promesa?: string | null;
  /** Obligatorio si `tipo === 'domicilio'`. */
  direccion_texto?: string | null;
  referencia_direccion?: string | null;
  /** true = nace ya confirmado (precio congelado). */
  confirmar?: boolean;
}

/**
 * PATCH parcial: sólo las claves presentes se aplican. Sólo sobre pedidos en `borrador`.
 * Se puede cambiar `tipo`/`canal`; al pasar a `domicilio` hay que mandar `direccion_texto`
 * en el mismo request. El envío ya NO es `costo_envio`: es una línea de producto `servicio`.
 */
export interface ActualizarPedidoRequest {
  lineas?: LineaPedidoRequest[];
  tipo?: TipoPedido | null;
  canal?: CanalPedido | null;
  cliente_id?: string | null;
  telefono?: string | null;
  descuento_total?: number | string;
  motivo_descuento?: string | null;
  codigo_cupon?: string | null;
  cliente_segmento?: string | null;
  notas?: string | null;
  fecha_promesa?: string | null;
  direccion_texto?: string | null;
  referencia_direccion?: string | null;
}

/** `PATCH /pedidos/{id}/asignaciones` — fija el responsable de líneas de servicio sin re-cotizar. */
export interface AsignarServiciosRequest {
  asignaciones: { detalle_id: string; asignado_a: string }[];
}

export interface LineaPedidoResponse {
  id: string;
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
  /** Línea de un producto tipo `servicio` (envío, instalación…). */
  es_servicio: boolean;
  /** Usuario responsable de la línea de servicio (null si aún sin asignar). */
  asignado_a: string | null;
}

export interface PagoPedidoResponse {
  id: string;
  monto: string;
  metodo_pago: MetodoPago;
  referencia: string | null;
  reembolsado: boolean;
  created_at: string;
}

export interface PedidoResponse {
  id: string;
  sucursal_id: string;
  usuario_id: string;
  cliente_id: string | null;
  tipo: TipoPedido;
  canal: CanalPedido;
  estado: EstadoPedido;
  estado_entrega: EstadoEntrega | null;
  telefono: string | null;
  descuento_total: string;
  motivo_descuento: string | null;
  codigo_cupon: string | null;
  cliente_segmento: string | null;
  notas: string | null;
  fecha_promesa: string | null;
  direccion_texto: string | null;
  referencia_direccion: string | null;
  repartidor_id: string | null;
  entrega_fallo_motivo: string | null;
  despachado_en: string | null;
  entregado_en: string | null;
  venta_id: string | null;
  created_at: string;

  subtotal: string;
  total: string;
  total_promociones: string;
  total_anticipos: string;
  /** total − total_anticipos → lo que cobra el POS al facturar. */
  saldo_por_cobrar: string;

  lineas: LineaPedidoResponse[];
  pagos: PagoPedidoResponse[];
}

/** Fila liviana de `GET /pedidos/` (sin `lineas` ni `pagos`). */
export interface PedidoListItem {
  id: string;
  tipo: TipoPedido;
  canal: CanalPedido;
  estado: EstadoPedido;
  estado_entrega: EstadoEntrega | null;
  telefono: string | null;
  cliente_id: string | null;
  repartidor_id: string | null;
  total: string;
  saldo_por_cobrar: string;
  fecha_promesa: string | null;
  venta_id: string | null;
  created_at: string;
}

export interface PedidoResumen {
  por_estado: Record<string, number>;
  por_estado_entrega: Record<string, number>;
}

export interface PedidoQuery {
  estado?: EstadoPedido;
  tipo?: TipoPedido;
  estado_entrega?: EstadoEntrega;
  sucursal_id?: string;
  cliente_id?: string;
  repartidor_id?: string;
  telefono?: string;
  canal?: CanalPedido;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
  /** `created_at:desc` (default) o `fecha_promesa:asc`. */
  sort?: string;
}

export interface EntregaRequest {
  estado_entrega?: EstadoEntrega;
  repartidor_id?: string | null;
  /** Obligatorio si `estado_entrega === 'fallido'`. */
  motivo?: string | null;
}

export interface AnticipoRequest {
  monto: number | string;
  metodo_pago: MetodoPago;
  referencia?: string | null;
}

export interface CancelarPedidoRequest {
  motivo?: string | null;
}

export interface FacturarPedidoRequest {
  caja_turno_id: string;
  pagos: PagoRequest[];
  /** true = re-corre mayoreo + promociones vigentes al facturar. */
  recalcular_precios?: boolean;
}
