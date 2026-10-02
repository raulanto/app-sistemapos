import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '@core/api.model';
import { AuditoriaLogResponse, AuditoriaQuery } from './auditoria.models';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/auditoria`;

  private buildParams(query?: AuditoriaQuery): HttpParams {
    let params = new HttpParams();
    if (query) {
      if (query.q) params = params.set('q', query.q);
      if (query.modulo) params = params.set('modulo', query.modulo);
      if (query.accion) params = params.set('accion', query.accion);
      if (query.entidad) params = params.set('entidad', query.entidad);
      if (query.entidad_id) params = params.set('entidad_id', query.entidad_id);
      if (query.usuario_id) params = params.set('usuario_id', query.usuario_id);
      if (query.desde) params = params.set('desde', query.desde);
      if (query.hasta) params = params.set('hasta', query.hasta);
      if (query.page) params = params.set('page', query.page);
      if (query.page_size) params = params.set('page_size', query.page_size);
      if (query.sort) params = params.set('sort', query.sort);
      if (query.include) params = params.set('include', query.include);
    }
    return params;
  }

  listar(query?: AuditoriaQuery): Observable<ApiResponse<AuditoriaLogResponse[]>> {
    const params = this.buildParams(query);
    return this.http.get<ApiResponse<AuditoriaLogResponse[]>>(this.API_URL, { params });
  }

  obtenerPorId(id: string): Observable<ApiResponse<AuditoriaLogResponse>> {
    return this.http.get<ApiResponse<AuditoriaLogResponse>>(`${this.API_URL}/${id}`);
  }
}
