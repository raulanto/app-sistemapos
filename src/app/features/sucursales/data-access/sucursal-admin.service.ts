import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  SucursalResponse,
  CrearSucursalRequest,
  ActualizarSucursalRequest,
  SucursalQuery
} from './sucursal.models';

/**
 * CRUD administrativo de sucursales (GET/POST /sucursales, PATCH /{id},
 * /{id}/desactivar, /{id}/reactivar). Distinto del `SucursalService` de
 * `core/sucursal` — ese solo mantiene la lista + sucursal activa para el
 * resto de la app (selector global, movimientos, etc.).
 */
@Injectable({
  providedIn: 'root'
})
export class SucursalAdminService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sucursales`;

  private buildParams(query?: SucursalQuery): HttpParams {
    let params = new HttpParams();
    if (query) {
      if (query.q) params = params.set('q', query.q);
      if (query.activo !== undefined && query.activo !== null) params = params.set('activo', query.activo);
      if (query.page) params = params.set('page', query.page);
      if (query.page_size) params = params.set('page_size', query.page_size);
      if (query.sort) params = params.set('sort', query.sort);
    }
    return params;
  }

  listar(query?: SucursalQuery): Observable<ApiResponse<SucursalResponse[]>> {
    const params = this.buildParams(query);
    return this.http.get<ApiResponse<SucursalResponse[]>>(this.API_URL, { params });
  }

  obtenerPorId(id: string): Observable<SucursalResponse> {
    return this.http.get<ApiResponse<SucursalResponse>>(`${this.API_URL}/${id}`).pipe(
      map(res => res.data)
    );
  }

  crear(sucursal: CrearSucursalRequest): Observable<SucursalResponse> {
    return this.http.post<ApiResponse<SucursalResponse>>(this.API_URL, sucursal).pipe(
      map(res => res.data)
    );
  }

  actualizar(id: string, sucursal: ActualizarSucursalRequest): Observable<SucursalResponse> {
    return this.http.patch<ApiResponse<SucursalResponse>>(`${this.API_URL}/${id}`, sucursal).pipe(
      map(res => res.data)
    );
  }

  desactivar(id: string): Observable<SucursalResponse> {
    return this.http.patch<ApiResponse<SucursalResponse>>(`${this.API_URL}/${id}/desactivar`, {}).pipe(
      map(res => res.data)
    );
  }

  reactivar(id: string): Observable<SucursalResponse> {
    return this.http.patch<ApiResponse<SucursalResponse>>(`${this.API_URL}/${id}/reactivar`, {}).pipe(
      map(res => res.data)
    );
  }
}
