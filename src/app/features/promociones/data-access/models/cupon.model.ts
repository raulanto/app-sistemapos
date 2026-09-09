/** Cupón que habilita una promoción `requiere_cupon = true`. Cuelga de la promo. */
export interface CuponResponse {
  codigo: string;
  promocion_id: string;
  activo: boolean;
  vigente_desde: string | null;
  vigente_hasta: string | null;
  max_usos_total: number | null;
  max_usos_por_persona: number | null;
  /** Usos ya registrados (los libera anular la venta). */
  usos?: number;
  created_at: string;
}

export interface CrearCuponRequest {
  codigo: string;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  /** `null` = sin límite. */
  max_usos_total?: number | null;
  max_usos_por_persona?: number | null;
}
