import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ApiResponse,
  HorarioRecursoRequest,
  HorarioRecursoResponse,
  RecursoCreateRequest,
  RecursoQuery,
  RecursoRenameRequest,
  RecursoResponse,
} from '../agenda.models';

@Injectable({ providedIn: 'root' })
export class RecursoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/agenda`;

  private toParams(query: object): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return params;
  }

  crearRecurso(req: RecursoCreateRequest): Observable<RecursoResponse> {
    return this.http
      .post<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos`, req)
      .pipe(map(r => r.data));
  }

  listarRecursos(query: RecursoQuery = {}): Observable<RecursoResponse[]> {
    return this.http
      .get<ApiResponse<RecursoResponse[]>>(`${this.API_URL}/recursos`, { params: this.toParams(query) })
      .pipe(map(r => r.data));
  }

  renombrarRecurso(id: string, req: RecursoRenameRequest): Observable<RecursoResponse> {
    return this.http
      .patch<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos/${id}`, req)
      .pipe(map(r => r.data));
  }

  /** Soft delete: desactiva el recurso (409 NombreRecursoEnUso lo bloquea si el nombre choca al reactivar). */
  eliminarRecurso(id: string): Observable<RecursoResponse> {
    return this.http.delete<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos/${id}`).pipe(map(r => r.data));
  }

  reactivarRecurso(id: string): Observable<RecursoResponse> {
    return this.http
      .patch<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos/${id}/reactivar`, {})
      .pipe(map(r => r.data));
  }

  crearHorarioRecurso(recursoId: string, req: HorarioRecursoRequest): Observable<HorarioRecursoResponse> {
    return this.http
      .post<ApiResponse<HorarioRecursoResponse>>(`${this.API_URL}/recursos/${recursoId}/horarios`, req)
      .pipe(map(r => r.data));
  }

  listarHorariosRecurso(recursoId: string): Observable<HorarioRecursoResponse[]> {
    return this.http
      .get<ApiResponse<HorarioRecursoResponse[]>>(`${this.API_URL}/recursos/${recursoId}/horarios`)
      .pipe(map(r => r.data));
  }
}
