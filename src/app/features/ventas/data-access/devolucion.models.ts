export type MetodoDevolucion = 'efectivo' | 'tarjeta' | 'credito' | 'monedero';

export const METODOS_DEVOLUCION: { value: MetodoDevolucion; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo (sale del cajón)' },
  { value: 'tarjeta', label: 'Tarjeta (reverso)' },
  { value: 'credito', label: 'Crédito (baja la deuda)' },
  { value: 'monedero', label: 'Monedero (reintegra al teléfono)' },
];

export interface DevolverVentaLineaRequest {
  detalle_venta_id: string;
  cantidad: number | string;
}

export interface DevolverVentaRequest {
  /** Turno EN QUE se hace la devolución (el abierto actual). */
  caja_turno_id: string;
  metodo_devolucion: MetodoDevolucion;
  lineas: DevolverVentaLineaRequest[];
  motivo?: string | null;
}

export interface DevolucionLineaResponse {
  id: string;
  detalle_venta_id: string;
  cantidad: string;
  monto: string;
}

export interface DevolucionResponse {
  id: string;
  venta_id: string;
  caja_turno_id: string;
  usuario_id: string;
  metodo_devolucion: MetodoDevolucion;
  monto_devuelto: string;
  motivo: string | null;
  created_at: string;
  lineas: DevolucionLineaResponse[];
}
