import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  CategoriaResponse, 
  CrearCategoriaRequest, 
  ActualizarCategoriaRequest, 
  ApiResponse 
} from './inventario.models';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/categorias`;

  listar(): Observable<CategoriaResponse[]> {
    return this.http.get<ApiResponse<CategoriaResponse[]>>(this.API_URL).pipe(
      map(res => res.data)
    );
  }

  obtenerPorId(id: string): Observable<CategoriaResponse> {
    return this.http.get<ApiResponse<CategoriaResponse>>(`${this.API_URL}/${id}`).pipe(
      map(res => res.data)
    );
  }

  crear(categoria: CrearCategoriaRequest): Observable<CategoriaResponse> {
    return this.http.post<ApiResponse<CategoriaResponse>>(this.API_URL, categoria).pipe(
      map(res => res.data)
    );
  }

  actualizar(id: string, categoria: ActualizarCategoriaRequest): Observable<CategoriaResponse> {
    return this.http.patch<ApiResponse<CategoriaResponse>>(`${this.API_URL}/${id}`, categoria).pipe(
      map(res => res.data)
    );
  }

  desactivar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/desactivar`, {});
  }
}
