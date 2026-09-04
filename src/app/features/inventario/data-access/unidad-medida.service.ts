import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  UnidadMedidaResponse,
  CrearUnidadMedidaRequest,
  ActualizarUnidadMedidaRequest
} from './inventario.models';

/**
 * Catálogo de unidades de medida (kg, l, ml, pza, reja, hora, …). Vincular un producto
 * a una de estas es opcional: define los decimales usados para redondear el stock.
 * Si no se usa, el producto sigue funcionando con el string libre `unidad_medida`.
 */
@Injectable({
  providedIn: 'root'
})
export class UnidadMedidaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/unidades-medida`;

  listar(incluirInactivas = false): Observable<UnidadMedidaResponse[]> {
    let params = new HttpParams();
    if (incluirInactivas) {
      params = params.set('incluir_inactivas', 'true');
    }
    return this.http.get<ApiResponse<UnidadMedidaResponse[]>>(this.API_URL, { params }).pipe(
      map(res => res.data)
    );
  }

  obtener(id: string): Observable<UnidadMedidaResponse> {
    return this.http.get<ApiResponse<UnidadMedidaResponse>>(`${this.API_URL}/${id}`).pipe(
      map(res => res.data)
    );
  }

  crear(request: CrearUnidadMedidaRequest): Observable<UnidadMedidaResponse> {
    return this.http.post<ApiResponse<UnidadMedidaResponse>>(this.API_URL, request).pipe(
      map(res => res.data)
    );
  }

  actualizar(id: string, request: ActualizarUnidadMedidaRequest): Observable<UnidadMedidaResponse> {
    return this.http.patch<ApiResponse<UnidadMedidaResponse>>(`${this.API_URL}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  desactivar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/desactivar`, {});
  }

  reactivar(id: string): Observable<UnidadMedidaResponse> {
    return this.http.patch<ApiResponse<UnidadMedidaResponse>>(`${this.API_URL}/${id}/reactivar`, {}).pipe(
      map(res => res.data)
    );
  }
}
