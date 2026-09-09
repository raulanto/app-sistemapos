/**
 * Re-exporta todos los modelos de inventario desde `models/`.
 * Los consumidores existentes pueden seguir importando desde aquí sin romperse.
 *
 * Para nuevos archivos, preferir importar directamente desde `./models`
 * o desde el archivo de modelo específico (e.g. `./models/producto.model`).
 */
export * from './models';

export type { PaginationMeta, ApiResponse } from '@core/api.model';
