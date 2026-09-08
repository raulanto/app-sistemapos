export type EstadoCajaTurno = 'abierto' | 'cerrado';

export interface CajaTurnoResponse {
  id: string;
  sucursal_id: string;
  usuario_id: string;
  saldo_inicial: string;
  estado: EstadoCajaTurno | string;
  abierto_en: string;
  cerrado_en: string | null;
  saldo_final_declarado: string | null;
  diferencia: string | null;
}

export interface AbrirTurnoRequest {
  saldo_inicial: number | string;
}

export interface CerrarTurnoRequest {
  saldo_final_declarado: number | string;
}

/** Arqueo: solo efectivo. `saldo_esperado = saldo_inicial + total_efectivo − total_devoluciones_efectivo`. */
export interface ResumenTurnoResponse {
  turno: CajaTurnoResponse;
  total_efectivo: string;
  /** Devoluciones en efectivo hechas EN este turno (salió plata del cajón). */
  total_devoluciones_efectivo: string;
  cantidad_ventas: number;
  saldo_esperado: string;
}

export interface CorteCajaResponse {
  caja_turno_id: string;
  monto_inicial: string;
  total_efectivo: string;
  total_tarjeta: string;
  total_transferencia: string;
  total_credito: string;
  /** Pagos cobrados con saldo de monedero (no es efectivo, no entra al arqueo). */
  total_monedero: string;
  total_descuento_promo: string;
  total_devoluciones_efectivo: string;
  monto_final_esperado: string;
  nota: string;
}
