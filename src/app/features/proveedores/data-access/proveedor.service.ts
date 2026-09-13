import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  CerrarDevolucionRequest,
  DevolucionProveedorCreateRequest,
  DevolucionProveedorQuery,
  DevolucionProveedorResponse,
  PedidoProveedorCreateRequest,
  PedidoProveedorQuery,
  PedidoProveedorResponse,
  ProductoProveedorCreateRequest,
  ProductoProveedorResponse,
  ProveedorCreateRequest,
  ProveedorQuery,
  ProveedorResponse,
  ProveedorUpdateRequest,
  RecepcionProveedorCreateRequest,
  RecepcionProveedorQuery,
  RecepcionProveedorResponse,
  ReordenGeneradoResponse,
  ResumenProveedorResponse,
} from './proveedores.models';

/**
 * Proveedores, su catálogo de productos, el motor de reorden, pedidos a proveedor,
 * recepción de mercancía y devoluciones. Cuelga de 4 bases distintas (ver guía):
 * `/proveedores`, `/pedidos-proveedor`, `/recepciones-proveedor`, `/devoluciones-proveedor`,
 * más el vínculo producto↔proveedor que cuelga de `/inventario/productos/{id}/proveedores`.
 */
@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private http = inject(HttpClient);
  private readonly BASE = environment.apiUrl;

  private toParams(query: object): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return params;
  }

  // --- Proveedores ---

  crear(req: ProveedorCreateRequest): Observable<ProveedorResponse> {
    return this.http.post<ApiResponse<ProveedorResponse>>(`${this.BASE}/proveedores`, req).pipe(map(r => r.data));
  }

  listar(query: ProveedorQuery = {}): Observable<ApiResponse<ProveedorResponse[]>> {
    return this.http.get<ApiResponse<ProveedorResponse[]>>(`${this.BASE}/proveedores`, {
      params: this.toParams(query),
    });
  }

  obtener(id: string): Observable<ProveedorResponse> {
    return this.http.get<ApiResponse<ProveedorResponse>>(`${this.BASE}/proveedores/${id}`).pipe(map(r => r.data));
  }

  actualizar(id: string, req: ProveedorUpdateRequest): Observable<ProveedorResponse> {
    return this.http
      .patch<ApiResponse<ProveedorResponse>>(`${this.BASE}/proveedores/${id}`, req)
      .pipe(map(r => r.data));
  }

  activar(id: string): Observable<ProveedorResponse> {
    return this.http
      .patch<ApiResponse<ProveedorResponse>>(`${this.BASE}/proveedores/${id}/activar`, {})
      .pipe(map(r => r.data));
  }

  desactivar(id: string): Observable<ProveedorResponse> {
    return this.http
      .patch<ApiResponse<ProveedorResponse>>(`${this.BASE}/proveedores/${id}/desactivar`, {})
      .pipe(map(r => r.data));
  }

  resumen(id: string): Observable<ResumenProveedorResponse> {
    return this.http
      .get<ApiResponse<ResumenProveedorResponse>>(`${this.BASE}/proveedores/${id}/resumen`)
      .pipe(map(r => r.data));
  }

  /** Vínculos producto-proveedor de este proveedor (no trae nombre/sku del producto). */
  listarProductosDeProveedor(id: string, incluirInactivos = false): Observable<ProductoProveedorResponse[]> {
    const params = new HttpParams().set('incluir_inactivos', String(incluirInactivos));
    return this.http
      .get<ApiResponse<ProductoProveedorResponse[]>>(`${this.BASE}/proveedores/${id}/productos`, { params })
      .pipe(map(r => r.data));
  }

  /** Dispara el motor de reorden: compara stock vs `stock_minimo` de cada vínculo principal activo. Nunca envía nada solo. */
  evaluarReorden(sucursalId?: string | null): Observable<ReordenGeneradoResponse[]> {
    const params = sucursalId ? new HttpParams().set('sucursal_id', sucursalId) : new HttpParams();
    return this.http
      .post<ApiResponse<ReordenGeneradoResponse[]>>(`${this.BASE}/proveedores/reorden/evaluar`, null, { params })
      .pipe(map(r => r.data));
  }

  // --- Vínculo producto ↔ proveedor (cuelga del producto) ---

  listarProveedoresDeProducto(productoId: string, incluirInactivos = false): Observable<ProductoProveedorResponse[]> {
    const params = new HttpParams().set('incluir_inactivos', String(incluirInactivos));
    return this.http
      .get<ApiResponse<ProductoProveedorResponse[]>>(`${this.BASE}/inventario/productos/${productoId}/proveedores`, {
        params,
      })
      .pipe(map(r => r.data));
  }

  vincularProveedor(productoId: string, req: ProductoProveedorCreateRequest): Observable<ProductoProveedorResponse> {
    return this.http
      .post<ApiResponse<ProductoProveedorResponse>>(
        `${this.BASE}/inventario/productos/${productoId}/proveedores`,
        req,
      )
      .pipe(map(r => r.data));
  }

  /** Baja lógica del vínculo; si era el principal, deja de serlo. */
  desvincularProveedor(productoId: string, id: string): Observable<ProductoProveedorResponse> {
    return this.http
      .delete<ApiResponse<ProductoProveedorResponse>>(
        `${this.BASE}/inventario/productos/${productoId}/proveedores/${id}`,
      )
      .pipe(map(r => r.data));
  }

  /** Lo marca principal y automáticamente le quita el puesto al anterior. */
  marcarPrincipal(productoId: string, id: string): Observable<ProductoProveedorResponse> {
    return this.http
      .patch<ApiResponse<ProductoProveedorResponse>>(
        `${this.BASE}/inventario/productos/${productoId}/proveedores/${id}/marcar-principal`,
        {},
      )
      .pipe(map(r => r.data));
  }

  // --- Pedidos a proveedor ---

  crearPedido(req: PedidoProveedorCreateRequest): Observable<PedidoProveedorResponse> {
    return this.http
      .post<ApiResponse<PedidoProveedorResponse>>(`${this.BASE}/pedidos-proveedor`, req)
      .pipe(map(r => r.data));
  }

  listarPedidos(query: PedidoProveedorQuery = {}): Observable<ApiResponse<PedidoProveedorResponse[]>> {
    return this.http.get<ApiResponse<PedidoProveedorResponse[]>>(`${this.BASE}/pedidos-proveedor`, {
      params: this.toParams(query),
    });
  }

  obtenerPedido(id: string): Observable<PedidoProveedorResponse> {
    return this.http
      .get<ApiResponse<PedidoProveedorResponse>>(`${this.BASE}/pedidos-proveedor/${id}`)
      .pipe(map(r => r.data));
  }

  /** Sólo admin/gerente (permiso aparte de crear/cancelar): borrador -> enviado. */
  confirmarEnvioPedido(id: string): Observable<PedidoProveedorResponse> {
    return this.http
      .post<ApiResponse<PedidoProveedorResponse>>(`${this.BASE}/pedidos-proveedor/${id}/confirmar-envio`, {})
      .pipe(map(r => r.data));
  }

  /** No se puede desde `recibido`. */
  cancelarPedido(id: string): Observable<PedidoProveedorResponse> {
    return this.http
      .post<ApiResponse<PedidoProveedorResponse>>(`${this.BASE}/pedidos-proveedor/${id}/cancelar`, {})
      .pipe(map(r => r.data));
  }

  // --- Recepciones ---

  /** Evento inmutable: entradas/mermas de inventario se generan solas, en la misma transacción. */
  crearRecepcion(req: RecepcionProveedorCreateRequest): Observable<RecepcionProveedorResponse> {
    return this.http
      .post<ApiResponse<RecepcionProveedorResponse>>(`${this.BASE}/recepciones-proveedor`, req)
      .pipe(map(r => r.data));
  }

  listarRecepciones(query: RecepcionProveedorQuery = {}): Observable<ApiResponse<RecepcionProveedorResponse[]>> {
    return this.http.get<ApiResponse<RecepcionProveedorResponse[]>>(`${this.BASE}/recepciones-proveedor`, {
      params: this.toParams(query),
    });
  }

  obtenerRecepcion(id: string): Observable<RecepcionProveedorResponse> {
    return this.http
      .get<ApiResponse<RecepcionProveedorResponse>>(`${this.BASE}/recepciones-proveedor/${id}`)
      .pipe(map(r => r.data));
  }

  // --- Devoluciones a proveedor ---

  crearDevolucion(req: DevolucionProveedorCreateRequest): Observable<DevolucionProveedorResponse> {
    return this.http
      .post<ApiResponse<DevolucionProveedorResponse>>(`${this.BASE}/devoluciones-proveedor`, req)
      .pipe(map(r => r.data));
  }

  listarDevoluciones(query: DevolucionProveedorQuery = {}): Observable<ApiResponse<DevolucionProveedorResponse[]>> {
    return this.http.get<ApiResponse<DevolucionProveedorResponse[]>>(`${this.BASE}/devoluciones-proveedor`, {
      params: this.toParams(query),
    });
  }

  obtenerDevolucion(id: string): Observable<DevolucionProveedorResponse> {
    return this.http
      .get<ApiResponse<DevolucionProveedorResponse>>(`${this.BASE}/devoluciones-proveedor/${id}`)
      .pipe(map(r => r.data));
  }

  enviarDevolucion(id: string): Observable<DevolucionProveedorResponse> {
    return this.http
      .post<ApiResponse<DevolucionProveedorResponse>>(`${this.BASE}/devoluciones-proveedor/${id}/enviar`, {})
      .pipe(map(r => r.data));
  }

  /** `resultado` se fija recién aquí; `tipo_resolucion` sólo si fue aceptada. */
  cerrarDevolucion(id: string, req: CerrarDevolucionRequest): Observable<DevolucionProveedorResponse> {
    return this.http
      .post<ApiResponse<DevolucionProveedorResponse>>(`${this.BASE}/devoluciones-proveedor/${id}/cerrar`, req)
      .pipe(map(r => r.data));
  }
}
