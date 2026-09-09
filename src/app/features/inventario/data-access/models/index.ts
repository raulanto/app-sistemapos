// ── Producto ─────────────────────────────────────────────
export type { TipoProducto, ProductoResponse, CrearProductoRequest, ActualizarProductoRequest, ProductoQuery, ProductoKpiResponse } from './producto.model';

// ── Imagen ───────────────────────────────────────────────
export type { ImagenResponse, AgregarImagenRequest, SubirImagenRequest, ActualizarImagenRequest } from './imagen.model';
export { IMAGEN_TIPOS_PERMITIDOS, IMAGEN_MAX_BYTES } from './imagen.model';

// ── Componente (Kit) ─────────────────────────────────────
export type { ComponenteResponse, AgregarComponenteRequest, ActualizarComponenteRequest, ReemplazarRecetaRequest } from './componente.model';

// ── Unidad (Presentación) ────────────────────────────────
export type { UnidadResponse, AgregarUnidadRequest, ActualizarUnidadRequest } from './unidad.model';

// ── Unidad de Medida (Catálogo) ──────────────────────────
export type { TipoMagnitud, UnidadMedidaResponse, CrearUnidadMedidaRequest, ActualizarUnidadMedidaRequest, ResolucionCodigoResponse } from './unidad-medida.model';

// ── Categoría ────────────────────────────────────────────
export type { CategoriaResponse, CrearCategoriaRequest, ActualizarCategoriaRequest } from './categoria.model';

// ── Existencia / Stock ───────────────────────────────────
export type { ExistenciaResponse, PresentacionDesglose, SucursalDesglose, DesgloseExistenciasResponse } from './existencia.model';

// ── Movimiento ───────────────────────────────────────────
export type { TipoMovimiento, MovimientoResponse, AplicarMovimientoRequest, TransferenciaRequest } from './movimiento.model';
