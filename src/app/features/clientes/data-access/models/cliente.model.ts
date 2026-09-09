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
