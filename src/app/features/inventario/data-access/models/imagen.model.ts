/**
 * Imagen de la galería de un producto o de una presentación.
 * Si vive en S3 (`object_key` presente), `url`/`thumbnail_url` salen PREFIRMADAS
 * y expiran (~1 h): hay que volver a pedir el GET para refrescarlas.
 * Si es una URL externa (flujo viejo), `url` va tal cual y `thumbnail_url` es null.
 */
export interface ImagenResponse {
  id: string;
  producto_id?: string | null;
  producto_unidad_id?: string | null;
  url?: string | null;
  /** Miniatura 400×400. Puede dar 404 ~1-2 s tras subir, hasta que la Lambda la genera. */
  thumbnail_url?: string | null;
  /** Identificador estable del objeto en S3. null en imágenes por URL externa. */
  object_key?: string | null;
  alt_texto?: string | null;
  orden: number;
  es_principal: boolean;
}

export interface AgregarImagenRequest {
  /** URL absoluta (http/https), máx. 2083 caracteres. Solo para imágenes hospedadas por terceros. */
  url: string;
  alt_texto?: string | null;
  orden?: number;
  /** Solo puede haber una principal: marcar otra desmarca la anterior. */
  es_principal?: boolean;
}

/** Cuerpo multipart/form-data para `POST .../imagenes/upload`. */
export interface SubirImagenRequest {
  file: File;
  alt_texto?: string | null;
  orden?: number;
  es_principal?: boolean;
}

/** MIME types aceptados por el backend para subir imágenes. */
export const IMAGEN_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** Tamaño máximo por imagen (5 MiB, espejo de `IMAGEN_MAX_BYTES` del backend). */
export const IMAGEN_MAX_BYTES = 5 * 1024 * 1024;

export interface ActualizarImagenRequest {
  url?: string | null;
  alt_texto?: string | null;
  /** Sin este flag, `alt_texto` null significa "no tocar"; con el flag, null lo borra. */
  cambiar_alt_texto?: boolean;
  orden?: number | null;
  es_principal?: boolean | null;
}
