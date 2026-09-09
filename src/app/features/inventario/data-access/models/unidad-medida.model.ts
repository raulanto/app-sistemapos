export type TipoMagnitud = 'conteo' | 'masa' | 'volumen' | 'longitud' | 'tiempo';

/** Catálogo de unidades de medida (kg, l, ml, pza, reja, hora, …). */
export interface UnidadMedidaResponse {
  id: string;
  codigo: string;
  nombre: string;
  tipo_magnitud: TipoMagnitud;
  decimales: number;
  activo: boolean;
}

export interface CrearUnidadMedidaRequest {
  codigo: string;
  nombre: string;
  tipo_magnitud: TipoMagnitud;
  decimales?: number;
}

export interface ActualizarUnidadMedidaRequest {
  nombre?: string;
  tipo_magnitud?: TipoMagnitud;
  decimales?: number;
}

/** Resultado de POS al escanear un código de barras (producto o presentación). */
export interface ResolucionCodigoResponse {
  producto_id: string;
  unidad_id?: string | null;
  nombre_unidad: string;
  unidad_medida: string;
  factor: string;
  precio_venta: string;
}
