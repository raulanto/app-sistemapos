import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  RolResponse,
  CrearRolRequest,
  EditarRolRequest,
  AsignarPermisosRequest,
  PermisoResponse,
  RolQuery,
} from './usuarios.models';

/**
 * Roles y sus permisos: GET/POST /roles, PATCH/DELETE /roles/{id},
 * POST /roles/{id}/permisos (añadir), DELETE /roles/{id}/permisos/{permiso_id} (quitar).
 * El catálogo global de permisos vive en GET /permisos.
 */
@Injectable({ providedIn: 'root' })
export class RolAdminService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/roles`;
  private readonly PERMISOS_URL = `${environment.apiUrl}/permisos`;

  listar(query?: RolQuery): Observable<ApiResponse<RolResponse[]>> {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page);
    if (query?.page_size) params = params.set('page_size', query.page_size);
    if (query?.sort) params = params.set('sort', query.sort);
    return this.http.get<ApiResponse<RolResponse[]>>(this.API_URL, { params });
  }

  /** Catálogo completo de permisos (una sola página grande; el backend topa en 100). */
  listarPermisos(): Observable<PermisoResponse[]> {
    const params = new HttpParams().set('page_size', 100).set('sort', 'codigo:asc');
    return this.http
      .get<ApiResponse<PermisoResponse[]>>(this.PERMISOS_URL, { params })
      .pipe(map(res => res.data));
  }

  crear(rol: CrearRolRequest): Observable<RolResponse> {
    return this.http.post<ApiResponse<RolResponse>>(this.API_URL, rol).pipe(map(res => res.data));
  }

  actualizar(id: string, cambios: EditarRolRequest): Observable<RolResponse> {
    return this.http.patch<ApiResponse<RolResponse>>(`${this.API_URL}/${id}`, cambios).pipe(map(res => res.data));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  asignarPermisos(id: string, request: AsignarPermisosRequest): Observable<RolResponse> {
    return this.http
      .post<ApiResponse<RolResponse>>(`${this.API_URL}/${id}/permisos`, request)
      .pipe(map(res => res.data));
  }

  quitarPermiso(id: string, permisoId: string): Observable<RolResponse> {
    return this.http
      .delete<ApiResponse<RolResponse>>(`${this.API_URL}/${id}/permisos/${permisoId}`)
      .pipe(map(res => res.data));
  }

  /**
   * Sincroniza los permisos de un rol al conjunto deseado: añade los que faltan
   * (un POST con `minItems: 1`) y quita los sobrantes (un DELETE por permiso).
   */
  sincronizarPermisos(id: string, actuales: string[], deseados: string[]): Observable<RolResponse | null> {
    const setActual = new Set(actuales);
    const setDeseado = new Set(deseados);
    const aAgregar = deseados.filter(p => !setActual.has(p));
    const aQuitar = actuales.filter(p => !setDeseado.has(p));

    if (aAgregar.length === 0 && aQuitar.length === 0) return of(null);

    const agregar$: Observable<unknown> =
      aAgregar.length > 0 ? this.asignarPermisos(id, { permiso_ids: aAgregar }) : of(null);

    return agregar$.pipe(
      switchMap((): Observable<RolResponse | null> => {
        if (aQuitar.length === 0) return of(null);
        return forkJoin(aQuitar.map(p => this.quitarPermiso(id, p))).pipe(map(res => res[res.length - 1] ?? null));
      }),
    );
  }
}
