import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  MarcaResponse,
  CrearMarcaRequest,
  ActualizarMarcaRequest,
  MarcaQuery,
} from '../models/marca.model';
import { ApiResponse, PaginationMeta } from '@core/api.model';

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

@Injectable({
  providedIn: 'root',
})
export class MarcaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/marcas`;

  listar(query?: MarcaQuery): Observable<PaginatedResponse<MarcaResponse>> {
    let params = new HttpParams();
    if (query) {
      if (query.q) params = params.set('q', query.q);
      if (query.activo !== undefined && query.activo !== null) params = params.set('activo', query.activo.toString());
      if (query.page) params = params.set('page', query.page.toString());
      if (query.page_size) params = params.set('page_size', query.page_size.toString());
      if (query.sort) params = params.set('sort', query.sort);
    }

    return this.http
      .get<ApiResponse<MarcaResponse[]>>(this.API_URL, { params })
      .pipe(
        map((res) => ({
          data: res.data,
          meta: res.meta?.pagination ?? {
            page: 1,
            page_size: res.data.length,
            total_items: res.data.length,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
        }))
      );
  }


  obtenerTodas(): Observable<MarcaResponse[]> {
    return this.listar({ page_size: 100, sort: 'nombre' }).pipe(map((res) => res.data));
  }


  obtenerPorId(id: string): Observable<MarcaResponse> {
    return this.http
      .get<ApiResponse<MarcaResponse>>(`${this.API_URL}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(marca: CrearMarcaRequest): Observable<MarcaResponse> {
    return this.http
      .post<ApiResponse<MarcaResponse>>(this.API_URL, marca)
      .pipe(map((res) => res.data));
  }

  actualizar(id: string, marca: ActualizarMarcaRequest): Observable<MarcaResponse> {
    return this.http
      .patch<ApiResponse<MarcaResponse>>(`${this.API_URL}/${id}`, marca)
      .pipe(map((res) => res.data));
  }

  activar(id: string): Observable<MarcaResponse> {
    return this.http
      .patch<ApiResponse<MarcaResponse>>(`${this.API_URL}/${id}/activar`, {})
      .pipe(map((res) => res.data));
  }

  desactivar(id: string): Observable<MarcaResponse> {
    return this.http
      .patch<ApiResponse<MarcaResponse>>(`${this.API_URL}/${id}/desactivar`, {})
      .pipe(map((res) => res.data));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

