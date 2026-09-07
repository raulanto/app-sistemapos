import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  CrearVentaRequest,
  VentaResponse,
  AnularVentaRequest,
  VentaQuery,
  ClienteResponse,
} from './ventas.models';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/ventas`;
  private readonly CLIENTES_URL = `${environment.apiUrl}/clientes`;

  /**
   * Registra una venta. `idempotencyKey` (un UUID por intento de cobro) evita la
   * venta doble en reintentos: mismo key ⇒ misma venta. Reusarla en cada retry.
   */
  crear(req: CrearVentaRequest, idempotencyKey: string): Observable<VentaResponse> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<ApiResponse<VentaResponse>>(`${this.API_URL}/`, req, { headers }).pipe(map(r => r.data));
  }

  listar(query: VentaQuery = {}): Observable<ApiResponse<VentaResponse[]>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<ApiResponse<VentaResponse[]>>(`${this.API_URL}/`, { params });
  }

  obtener(id: string, include = 'cliente,usuario,caja_turno'): Observable<VentaResponse> {
    const params = new HttpParams().set('include', include);
    return this.http.get<ApiResponse<VentaResponse>>(`${this.API_URL}/${id}`, { params }).pipe(map(r => r.data));
  }

  anular(id: string, req: AnularVentaRequest): Observable<VentaResponse> {
    return this.http.patch<ApiResponse<VentaResponse>>(`${this.API_URL}/${id}/anular`, req).pipe(map(r => r.data));
  }

  /** Búsqueda de clientes para venta a crédito. */
  buscarClientes(q: string): Observable<ClienteResponse[]> {
    let params = new HttpParams().set('activo', 'true').set('page_size', '10').set('sort', 'nombre:asc');
    if (q) params = params.set('q', q);
    return this.http.get<ApiResponse<ClienteResponse[]>>(`${this.CLIENTES_URL}/`, { params }).pipe(map(r => r.data));
  }
}
