import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  ClienteResponse,
  ClienteQuery,
  CrearClienteRequest,
  ActualizarClienteRequest,
  AbonarClienteRequest,
  CambiarLimiteCreditoRequest,
} from './clientes.models';
import { VentaListItem } from '../../ventas/data-access/venta.models';

/** Query del historial de ventas de un cliente (`GET /clientes/{id}/ventas`). */
export interface ClienteVentasQuery {
  page?: number;
  page_size?: number;
  sort?: string;
  include?: string;
}

/**
 * Clientes y su crédito: GET/POST `/clientes`, PATCH `/{id}`, POST `/{id}/abonar`,
 * PATCH `/{id}/credito`, PATCH `/{id}/desactivar`.
 */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/clientes`;

  listar(query: ClienteQuery = {}): Observable<ApiResponse<ClienteResponse[]>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<ApiResponse<ClienteResponse[]>>(`${this.API_URL}/`, { params });
  }

  obtener(id: string, include = 'sucursal'): Observable<ClienteResponse> {
    const params = new HttpParams().set('include', include);
    return this.http.get<ApiResponse<ClienteResponse>>(`${this.API_URL}/${id}`, { params }).pipe(map(r => r.data));
  }

  crear(req: CrearClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ApiResponse<ClienteResponse>>(`${this.API_URL}/`, req).pipe(map(r => r.data));
  }

  actualizar(id: string, req: ActualizarClienteRequest): Observable<ClienteResponse> {
    return this.http.patch<ApiResponse<ClienteResponse>>(`${this.API_URL}/${id}`, req).pipe(map(r => r.data));
  }

  /** Registra un pago contra la deuda del cliente (baja `saldo_credito`). */
  abonar(id: string, req: AbonarClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ApiResponse<ClienteResponse>>(`${this.API_URL}/${id}/abonar`, req).pipe(map(r => r.data));
  }

  cambiarLimiteCredito(id: string, req: CambiarLimiteCreditoRequest): Observable<ClienteResponse> {
    return this.http.patch<ApiResponse<ClienteResponse>>(`${this.API_URL}/${id}/credito`, req).pipe(map(r => r.data));
  }

  desactivar(id: string): Observable<ClienteResponse> {
    return this.http.patch<ApiResponse<ClienteResponse>>(`${this.API_URL}/${id}/desactivar`, {}).pipe(map(r => r.data));
  }

  /** Historial de compras del cliente (`VentaListItem`, mismo shape que el historial general). */
  historialVentas(clienteId: string, query: ClienteVentasQuery = {}): Observable<ApiResponse<VentaListItem[]>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<ApiResponse<VentaListItem[]>>(`${this.API_URL}/${clienteId}/ventas`, { params });
  }
}
