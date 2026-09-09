// --- Monedero electrónico (cashback por teléfono) ---
// Endpoints: /api/v1/clientes/monedero/{telefono}[/movimientos|/ajustar]

/** Saldo del monedero de un teléfono. `GET .../monedero/{telefono}` (404 = no existe). */
export interface MonederoResponse {
  id: string;
  telefono: string;
  saldo: string;
  activo: boolean;
  created_at: string;
}

/** Renglón del ledger del monedero. `tipo`: acumulacion | consumo | reverso | ajuste. */
export interface MovimientoMonederoResponse {
  id: string;
  tipo: string;
  monto: string;
  saldo_resultante: string;
  venta_id?: string | null;
  motivo?: string | null;
  created_at: string;
}

/** `POST .../monedero/{telefono}/ajustar` — `monto` con signo (±). Permiso `monedero.ajustar`. */
export interface AjustarMonederoRequest {
  monto: number | string;
  motivo?: string | null;
}
