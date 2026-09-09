import type { ProductoResponse } from './producto.model';

export interface ComponenteResponse {
  producto_kit_id: string;
  producto_componente_id: string;
  cantidad: string;
  componente?: ProductoResponse; // Embebido opcional
}

export interface AgregarComponenteRequest {
  producto_componente_id: string;
  cantidad: number | string;
}

export interface ActualizarComponenteRequest {
  cantidad: number | string;
}

/** Reemplaza la receta completa de un kit en una sola llamada (PUT /componentes). */
export interface ReemplazarRecetaRequest {
  componentes: Array<{ producto_componente_id: string; cantidad: number | string }>;
}
