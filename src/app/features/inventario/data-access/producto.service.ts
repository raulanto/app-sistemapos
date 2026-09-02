import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { 
  ProductoResponse, 
  CrearProductoRequest, 
  ActualizarProductoRequest, 
  ApiResponse,
  ProductoQuery
} from './inventario.models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/productos`;

  listar(query?: ProductoQuery): Observable<ApiResponse<ProductoResponse[]>> {
    let params = new HttpParams();
    
    if (query) {
      if (query.q) params = params.set('q', query.q);
      if (query.categoria_id && query.categoria_id.length > 0) {
        query.categoria_id.forEach(id => {
          params = params.append('categoria_id', id);
        });
      }
      if (query.sucursal_id && query.sucursal_id.length > 0) {
        query.sucursal_id.forEach(id => {
          params = params.append('sucursal_id', id);
        });
      }
      if (query.activo !== undefined && query.activo !== null) params = params.set('activo', query.activo);
      if (query.page) params = params.set('page', query.page);
      if (query.page_size) params = params.set('page_size', query.page_size);
      if (query.sort) params = params.set('sort', query.sort);
      if (query.include?.length) {
        const includeValues = query.include.map(item => 
          typeof item === 'string' ? item : `${item.type}[sucursal_id]=${item.sucursal_id}`
        );
        params = params.set('include', includeValues.join(','));
      }
    }

    return this.http.get<ApiResponse<ProductoResponse[]>>(this.API_URL, { params });
  }

  obtenerPorId(id: string, include?: string): Observable<ProductoResponse> {
    let params = new HttpParams();
    if (include) {
      params = params.set('include', include);
    }
    return this.http.get<ApiResponse<ProductoResponse>>(`${this.API_URL}/${id}`, { params }).pipe(
      map(res => res.data)
    );
  }

  crear(producto: CrearProductoRequest): Observable<ProductoResponse> {
    return this.http.post<ApiResponse<ProductoResponse>>(this.API_URL, producto).pipe(
      map(res => res.data)
    );
  }

  actualizar(id: string, producto: ActualizarProductoRequest): Observable<ProductoResponse> {
    return this.http.patch<ApiResponse<ProductoResponse>>(`${this.API_URL}/${id}`, producto).pipe(
      map(res => res.data)
    );
  }

  desactivar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/desactivar`, {});
  }

  activar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/activar`, {});
  }

  actualizarUmbrales(producto_id: string, sucursal_id: string, umbrales: { stock_minimo: number; stock_maximo?: number }): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/inventario/existencias/${producto_id}/${sucursal_id}/umbrales`, umbrales);
  }
}
