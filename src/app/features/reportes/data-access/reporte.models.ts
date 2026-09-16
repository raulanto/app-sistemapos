export type { ApiResponse, PaginationMeta } from '@core/api.model';

export interface RangoQuery {
  desde?: string;
  hasta?: string;
  sucursal_id?: string;
}

export interface PaginacionQuery {
  page?: number;
  page_size?: number;
}

export interface CorteCajaReporte {
  caja_turno_id: string;
  monto_inicial: string;
  total_efectivo: string;
  total_tarjeta: string;
  total_transferencia: string;
  total_credito: string;
  total_monedero: string;
  monto_final_esperado: string;
  total_descuento_promo: string;
  total_devoluciones_efectivo: string;
  total_ingresos: string;
  total_retiros: string;
  total_gastos: string;
  nota: string;
}

export interface VentaPorDia {
  dia: string;
  numero_ventas: number;
  total: string;
}

export interface VentasReporte {
  desde: string;
  hasta: string;
  sucursal_id: string | null;
  total_vendido: string;
  numero_ventas: number;
  ticket_promedio: string;
  total_descuento_promo: string;
  por_dia: VentaPorDia[];
}

export interface VentaMetodoPagoDetalle {
  metodo_pago: string;
  total: string;
}

export interface VentasPorMetodoPagoReporte {
  desde: string;
  hasta: string;
  sucursal_id: string | null;
  total_efectivo: string;
  total_tarjeta: string;
  total_transferencia: string;
  total_credito: string;
  total_monedero: string;
  total_general: string;
  detalle: VentaMetodoPagoDetalle[];
}

export interface VentaPorUsuarioItem {
  usuario_id: string;
  nombre: string;
  numero_ventas: number;
  total_vendido: string;
}

export interface ProductoMasVendidoItem {
  producto_id: string;
  sku: string;
  nombre: string;
  cantidad_vendida: string;
  monto_total: string;
}

export interface InventarioPorCategoria {
  categoria_id: string;
  nombre: string;
  valor: string;
  numero_productos: number;
}

export interface InventarioValorizadoReporte {
  sucursal_id: string | null;
  categoria_id: string | null;
  valor_total: string;
  por_categoria: InventarioPorCategoria[];
}

export interface MermaAjusteDetalle {
  tipo: 'merma' | 'ajuste';
  numero_movimientos: number;
  cantidad_total: string;
  valor_estimado: string;
}

export interface MermasAjustesReporte {
  desde: string;
  hasta: string;
  sucursal_id: string | null;
  total_merma: string;
  total_ajuste: string;
  valor_estimado_total: string;
  detalle: MermaAjusteDetalle[];
}

export interface ClienteConSaldoItem {
  cliente_id: string;
  nombre: string;
  saldo_credito: string;
  limite_credito: string;
}

export interface CajaAbiertaItem {
  sucursal_id: string;
  caja_turno_id: string;
  usuario_id: string;
  abierto_en: string;
  saldo_inicial: string;
}

export interface DashboardReporte {
  sucursal_id: string | null;
  ventas_hoy: VentasReporte;
  ventas_ayer: VentasReporte;
  top_productos_hoy: ProductoMasVendidoItem[];
  productos_bajo_stock: number;
  cajas_abiertas: CajaAbiertaItem[];
}

/** `?formato=` aceptado por los 8 reportes de la tabla (todos salvo /dashboard). */
export type FormatoExport = 'csv' | 'excel' | 'pdf';

/** Los únicos 5 reportes "de período" que se pueden programar (sin id puntual como caja_turno_id). */
export type TipoReporteProgramable = 'ventas' | 'ventas_por_metodo_pago' | 'inventario_valorizado' | 'mermas_ajustes' | 'clientes_con_saldo';

export type FrecuenciaReporteProgramado = 'diaria' | 'semanal' | 'mensual';

export interface ReporteProgramadoResponse {
  id: string;
  tipo_reporte: TipoReporteProgramable;
  frecuencia: FrecuenciaReporteProgramado;
  formato_salida: FormatoExport;
  destinatarios: string[];
  sucursal_id: string | null;
  activo: boolean;
  ultima_ejecucion: string | null;
}

export interface CrearReporteProgramadoRequest {
  tipo_reporte: TipoReporteProgramable;
  frecuencia: FrecuenciaReporteProgramado;
  formato_salida: FormatoExport;
  destinatarios: string[];
  sucursal_id?: string | null;
}
