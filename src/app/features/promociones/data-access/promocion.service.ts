import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  PromocionResponse,
  CrearPromocionRequest,
  ActualizarPromocionRequest,
  PromocionQuery,
  CuponResponse,
  CrearCuponRequest,
} from './promociones.models';

@Injectable({ providedIn: 'root' })
export class PromocionService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/promociones`;

  listar(query: PromocionQuery = {}): Observable<ApiResponse<PromocionResponse[]>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<ApiResponse<PromocionResponse[]>>(this.API_URL, { params });
  }

  obtener(id: string): Observable<PromocionResponse> {
    return this.http.get<ApiResponse<PromocionResponse>>(`${this.API_URL}/${id}`).pipe(map(r => r.data));
  }

  crear(req: CrearPromocionRequest): Observable<PromocionResponse> {
    return this.http.post<ApiResponse<PromocionResponse>>(this.API_URL, req).pipe(map(r => r.data));
  }

  actualizar(id: string, req: ActualizarPromocionRequest): Observable<PromocionResponse> {
    return this.http.patch<ApiResponse<PromocionResponse>>(`${this.API_URL}/${id}`, req).pipe(map(r => r.data));
  }

  desactivar(id: string): Observable<PromocionResponse> {
    return this.http.patch<ApiResponse<PromocionResponse>>(`${this.API_URL}/${id}/desactivar`, {}).pipe(map(r => r.data));
  }

  reactivar(id: string): Observable<PromocionResponse> {
    return this.http.patch<ApiResponse<PromocionResponse>>(`${this.API_URL}/${id}/reactivar`, {}).pipe(map(r => r.data));
  }

  // --- Cupones (cuelgan de una promoción) ---

  listarCupones(promocionId: string): Observable<CuponResponse[]> {
    return this.http
      .get<ApiResponse<CuponResponse[]>>(`${this.API_URL}/${promocionId}/cupones`)
      .pipe(map(r => r.data));
  }

  crearCupon(promocionId: string, req: CrearCuponRequest): Observable<CuponResponse> {
    return this.http
      .post<ApiResponse<CuponResponse>>(`${this.API_URL}/${promocionId}/cupones`, req)
      .pipe(map(r => r.data));
  }

  desactivarCupon(codigo: string): Observable<CuponResponse> {
    return this.http
      .patch<ApiResponse<CuponResponse>>(`${this.API_URL}/cupones/${encodeURIComponent(codigo)}/desactivar`, {})
      .pipe(map(r => r.data));
  }
}
