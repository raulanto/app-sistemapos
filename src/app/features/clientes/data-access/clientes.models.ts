// Envelope estándar de la API. Cada feature declara el suyo (patrón del repo).
export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    sort?: string;
    filters?: unknown;
    summary?: unknown;
  };
  links?: { self?: string; next?: string; prev?: string };
}

export interface SucursalEmbed {
  id: string;
  nombre: string;
}

export interface ClienteResponse {
  id: string;
  sucursal_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  rfc_identificacion: string | null;
  /** Dinero como string decimal. */
  limite_credito: string;
  saldo_credito: string;
  activo: boolean;
  created_at: string;
  sucursal?: SucursalEmbed | null;
}

/** Fila de `GET /reportes/clientes-con-saldo`. */
export interface ClienteSaldoResponse {
  id: string;
  nombre: string;
  saldo_credito: string;
  limite_credito: string;
}

export interface CrearClienteRequest {
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  rfc_identificacion?: string | null;
  limite_credito?: number | string;
}

/**
 * PATCH parcial. `email` sólo se toca si `cambiar_email` es true (así se puede
 * limpiar con null sin pisarlo por accidente). `telefono` / `rfc_identificacion`
 * se mandan tal cual (null los limpia). El límite de crédito tiene endpoint propio.
 */
export interface ActualizarClienteRequest {
  nombre?: string | null;
  email?: string | null;
  cambiar_email?: boolean;
  telefono?: string | null;
  rfc_identificacion?: string | null;
}

export interface AbonarClienteRequest {
  monto: number | string;
}

export interface CambiarLimiteCreditoRequest {
  limite_credito: number | string;
}

export interface ClienteQuery {
  q?: string;
  activo?: boolean;
  con_saldo_pendiente?: boolean;
  sucursal_id?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  include?: string;
}

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
