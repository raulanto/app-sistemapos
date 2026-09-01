import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  MovimientoResponse, 
  ApiResponse 
} from './inventario.models';

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/movimientos`;

  listar(): Observable<MovimientoResponse[]> {
    return this.http.get<ApiResponse<MovimientoResponse[]>>(this.API_URL).pipe(
      map(res => res.data)
    );
  }

  obtenerPorId(id: string): Observable<MovimientoResponse> {
    return this.http.get<ApiResponse<MovimientoResponse>>(`${this.API_URL}/${id}`).pipe(
      map(res => res.data)
    );
  }
}
