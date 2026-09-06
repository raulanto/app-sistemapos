import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  UsuarioResponse,
  CrearUsuarioRequest,
  EditarUsuarioRequest,
  CambiarRolRequest,
  CambiarPasswordRequest,
  UsuarioQuery,
} from './usuarios.models';

/**
 * CRUD administrativo de usuarios (GET/POST /usuarios, PATCH /{id},
 * /{id}/rol, /{id}/cambiar-password, /{id}/desactivar).
 * No gestiona la sesión — de eso se encarga `core/auth/AuthService`.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioAdminService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  private buildParams(query?: UsuarioQuery): HttpParams {
    let params = new HttpParams();
    if (query) {
      if (query.page) params = params.set('page', query.page);
      if (query.page_size) params = params.set('page_size', query.page_size);
      if (query.sort) params = params.set('sort', query.sort);
      if (query.include) params = params.set('include', query.include);
    }
    return params;
  }

  listar(query?: UsuarioQuery): Observable<ApiResponse<UsuarioResponse[]>> {
    return this.http.get<ApiResponse<UsuarioResponse[]>>(this.API_URL, { params: this.buildParams(query) });
  }

  obtenerPorId(id: string, include = 'rol,sucursal'): Observable<UsuarioResponse> {
    const params = new HttpParams().set('include', include);
    return this.http
      .get<ApiResponse<UsuarioResponse>>(`${this.API_URL}/${id}`, { params })
      .pipe(map(res => res.data));
  }

  crear(usuario: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<ApiResponse<UsuarioResponse>>(this.API_URL, usuario).pipe(map(res => res.data));
  }

  actualizar(id: string, cambios: EditarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.patch<ApiResponse<UsuarioResponse>>(`${this.API_URL}/${id}`, cambios).pipe(map(res => res.data));
  }

  cambiarRol(id: string, request: CambiarRolRequest): Observable<UsuarioResponse> {
    return this.http.patch<ApiResponse<UsuarioResponse>>(`${this.API_URL}/${id}/rol`, request).pipe(map(res => res.data));
  }

  cambiarPassword(id: string, request: CambiarPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/cambiar-password`, request);
  }

  desactivar(id: string): Observable<UsuarioResponse> {
    return this.http.patch<ApiResponse<UsuarioResponse>>(`${this.API_URL}/${id}/desactivar`, {}).pipe(map(res => res.data));
  }

  reactivar(id: string): Observable<UsuarioResponse> {
    return this.http.patch<ApiResponse<UsuarioResponse>>(`${this.API_URL}/${id}/reactivar`, {}).pipe(map(res => res.data));
  }
}
