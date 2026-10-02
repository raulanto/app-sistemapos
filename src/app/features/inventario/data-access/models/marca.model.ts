export interface MarcaResponse {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface MarcaEmbed {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface CrearMarcaRequest {
  nombre: string;
}

export interface ActualizarMarcaRequest {
  nombre?: string;
}

export interface MarcaQuery {
  activo?: boolean | null;
  q?: string | null;
  page?: number;
  page_size?: number;
  sort?: string;
}
