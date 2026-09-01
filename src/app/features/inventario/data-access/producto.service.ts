import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  ProductoResponse, 
  CrearProductoRequest, 
  ActualizarProductoRequest, 
  ApiResponse 
} from './inventario.models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/productos`;

  listar(): Observable<ProductoResponse[]> {
    return this.http.get<ApiResponse<ProductoResponse[]>>(this.API_URL).pipe(
      map(res => res.data)
    );
  }

  obtenerPorId(id: string): Observable<ProductoResponse> {
    return this.http.get<ApiResponse<ProductoResponse>>(`${this.API_URL}/${id}`).pipe(
      map(res => res.data)
    );
  }

  crear(producto: CrearProductoRequest): Observable<ProductoResponse> {
    return this.http.post<ApiResponse<ProductoResponse>>(this.API_URL, producto).pipe(
      map(res => res.data)
    );
  }

  actualizar(id: string, producto: ActualizarProductoRequest): Observable<ProductoResponse> {
    return this.http.put<ApiResponse<ProductoResponse>>(`${this.API_URL}/${id}`, producto).pipe(
      map(res => res.data)
    );
  }

  desactivar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/desactivar`, {});
  }
}
