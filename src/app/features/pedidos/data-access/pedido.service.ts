import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ActualizarPedidoRequest,
  AnticipoRequest,
  ApiResponse,
  AsignarServiciosRequest,
  CancelarPedidoRequest,
  CrearPedidoRequest,
  EntregaRequest,
  FacturarPedidoRequest,
  PedidoListItem,
  PedidoQuery,
  PedidoResponse,
  PedidoResumen,
  VentaResponse,
} from './pedidos.models';

/**
 * Órdenes / pedidos (`/api/v1/pedidos`). Ciclo: borrador → confirmado → facturado.
 * La sucursal sale del usuario autenticado. Al facturar se emite una venta normal.
 */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/pedidos`;

  private idemHeaders(key?: string) {
    return key ? { headers: new HttpHeaders({ 'Idempotency-Key': key }) } : {};
  }

  /** Crea un pedido. El backend recotiza cada línea (mayoreo + promos). No toca stock. */
  crear(req: CrearPedidoRequest, idempotencyKey?: string): Observable<PedidoResponse> {
    return this.http
      .post<ApiResponse<PedidoResponse>>(`${this.API_URL}/`, req, this.idemHeaders(idempotencyKey))
      .pipe(map(r => r.data));
  }

  listar(query: PedidoQuery = {}): Observable<ApiResponse<PedidoListItem[]>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<ApiResponse<PedidoListItem[]>>(`${this.API_URL}/`, { params });
  }

  /** Contadores por estado y por estado_entrega, para los badges del tablero. */
  resumen(sucursalId?: string): Observable<PedidoResumen> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursal_id', sucursalId);
    return this.http.get<ApiResponse<PedidoResumen>>(`${this.API_URL}/resumen`, { params }).pipe(map(r => r.data));
  }

  obtener(id: string): Observable<PedidoResponse> {
    return this.http.get<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}`).pipe(map(r => r.data));
  }

  /** PATCH parcial. Sólo sobre pedidos en `borrador` (si no, 400 PedidoNoEditable). */
  actualizar(id: string, req: ActualizarPedidoRequest): Observable<PedidoResponse> {
    return this.http.patch<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}`, req).pipe(map(r => r.data));
  }

  /** borrador → confirmado: recotiza una última vez y congela el precio. */
  confirmar(id: string): Observable<PedidoResponse> {
    return this.http.post<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}/confirmar`, {}).pipe(map(r => r.data));
  }

  /** confirmado → borrador, para seguir editando. */
  reabrir(id: string): Observable<PedidoResponse> {
    return this.http.post<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}/reabrir`, {}).pipe(map(r => r.data));
  }

  cancelar(id: string, req: CancelarPedidoRequest): Observable<PedidoResponse> {
    return this.http.post<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}/cancelar`, req).pipe(map(r => r.data));
  }

  /** Asigna repartidor y/o avanza `estado_entrega`. `motivo` obligatorio si `fallido`. */
  entrega(id: string, req: EntregaRequest): Observable<PedidoResponse> {
    return this.http.patch<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}/entrega`, req).pipe(map(r => r.data));
  }

  /** Fija/reasigna el responsable de líneas de servicio sin re-cotizar. Vale en `borrador` y `confirmado`. */
  asignaciones(id: string, req: AsignarServiciosRequest): Observable<PedidoResponse> {
    return this.http
      .patch<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}/asignaciones`, req)
      .pipe(map(r => r.data));
  }

  /** Registra un anticipo (prepago). Baja el `saldo_por_cobrar`. */
  anticipo(id: string, req: AnticipoRequest): Observable<PedidoResponse> {
    return this.http.post<ApiResponse<PedidoResponse>>(`${this.API_URL}/${id}/anticipos`, req).pipe(map(r => r.data));
  }

  /**
   * Emite la venta (requiere turno abierto). Devuelve la venta completa; el pedido
   * queda `facturado` con `venta_id`. Idempotente con `idempotencyKey`.
   */
  facturar(id: string, req: FacturarPedidoRequest, idempotencyKey?: string): Observable<VentaResponse> {
    return this.http
      .post<ApiResponse<VentaResponse>>(`${this.API_URL}/${id}/facturar`, req, this.idemHeaders(idempotencyKey))
      .pipe(map(r => r.data));
  }
}
