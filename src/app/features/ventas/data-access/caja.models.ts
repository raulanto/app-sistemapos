export type EstadoCajaTurno = 'abierto' | 'cerrado' | 'cerrado_con_diferencia' | 'conciliado';

export const ESTADOS_TURNO: { value: EstadoCajaTurno; label: string }[] = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'cerrado_con_diferencia', label: 'Cerrado con diferencia' },
  { value: 'conciliado', label: 'Conciliado' },
];

/** Umbral por defecto de `CAJA_DIFERENCIA_UMBRAL`: pasado esto, el cierre exige `nota_cierre`. */
export const DIFERENCIA_UMBRAL = 20; // ponytail: espejo del env del backend; si lo cambian, ajustar aquí

/** Desglose por denominación (billete/moneda). Su suma debe cuadrar con el saldo declarado. */
export interface DenominacionItem {
  valor: number;
  cantidad: number;
}

/** Caja física (terminal) de una sucursal. */
export interface CajaResponse {
  id: string;
  sucursal_id: string;
  nombre: string;
  activo: boolean;
  created_at?: string;
}

export interface CrearCajaRequest {
  nombre: string;
}

export interface ActualizarCajaRequest {
  nombre: string;
}

export interface CajaTurnoResponse {
  id: string;
  sucursal_id: string;
  caja_id?: string | null;
  usuario_id: string;
  saldo_inicial: string;
  estado: EstadoCajaTurno | string;
  abierto_en: string;
  cerrado_en: string | null;
  saldo_final_declarado: string | null;
  diferencia: string | null;
  nota_cierre?: string | null;
  conciliado_por?: string | null;
  conciliado_en?: string | null;
  caja?: CajaResponse | null;
  usuario?: { id: string; nombre: string } | null;
}

export interface AbrirTurnoRequest {
  caja_id: string;
  saldo_inicial: number | string;
  /** Opcional; si viene, su suma debe = `saldo_inicial`. */
  denominaciones?: DenominacionItem[];
}

export interface CerrarTurnoRequest {
  saldo_final_declarado: number | string;
  /** Obligatoria si `|diferencia|` alcanza el umbral. */
  nota_cierre?: string | null;
  denominaciones?: DenominacionItem[];
}

export interface ConciliarTurnoRequest {
  nota?: string | null;
}

/**
 * Arqueo (solo efectivo):
 * `saldo_esperado = saldo_inicial + total_efectivo − total_devoluciones_efectivo + movimientos_neto`.
 */
export interface ResumenTurnoResponse {
  turno: CajaTurnoResponse;
  total_efectivo: string;
  /** Devoluciones en efectivo hechas EN este turno (salió plata del cajón). */
  total_devoluciones_efectivo: string;
  cantidad_ventas: number;
  total_ingresos?: string;
  total_retiros?: string;
  total_gastos?: string;
  /** `ingresos − retiros − gastos`. */
  movimientos_neto?: string;
  saldo_esperado: string;
  denominaciones_apertura?: DenominacionItem[];
  denominaciones_cierre?: DenominacionItem[];
}

export type MovimientoCajaTipo = 'retiro' | 'ingreso' | 'gasto';

export const MOVIMIENTOS_CAJA: { value: MovimientoCajaTipo; label: string; hint: string }[] = [
  { value: 'retiro', label: 'Retiro', hint: 'Sale efectivo del cajón (traslado a caja fuerte)' },
  { value: 'ingreso', label: 'Ingreso', hint: 'Entra efectivo sin ser una venta (refuerzo de fondo)' },
  { value: 'gasto', label: 'Gasto', hint: 'Se paga algo del cajón' },
];

export interface MovimientoCajaResponse {
  id: string;
  caja_turno_id: string;
  tipo: MovimientoCajaTipo;
  monto: string;
  motivo: string | null;
  created_at: string;
  usuario_id?: string;
}

export interface CrearMovimientoCajaRequest {
  tipo: MovimientoCajaTipo;
  monto: number | string;
  /** Obligatorio para `retiro` y `gasto`. */
  motivo?: string | null;
}

export interface TurnoHistoricoQuery {
  sucursal_id?: string;
  caja_id?: string;
  usuario_id?: string;
  estado?: EstadoCajaTurno;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
  sort?: string;
}

/** `GET /caja-turnos/efectivo-actual`: efectivo que debería haber en los cajones abiertos ahora. */
export interface EfectivoActualResponse {
  efectivo_esperado: string;
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
  total_ingresos?: string;
  total_retiros?: string;
  total_gastos?: string;
  monto_final_esperado: string;
  nota: string;
}
