import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { 
  MovimientoResponse, 
  ApiResponse 
} from './inventario.models';

export interface MovimientoQuery {
  producto_id?: string;
  sucursal_id?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  include?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/movimientos`;

  listar(query?: MovimientoQuery): Observable<MovimientoResponse[]> {
    let params = new HttpParams();
    
    if (query) {
      if (query.producto_id) params = params.set('producto_id', query.producto_id);
      if (query.sucursal_id) params = params.set('sucursal_id', query.sucursal_id);
      if (query.tipo) params = params.set('tipo', query.tipo);
      if (query.desde) params = params.set('desde', query.desde);
      if (query.hasta) params = params.set('hasta', query.hasta);
      if (query.page) params = params.set('page', query.page);
      if (query.page_size) params = params.set('page_size', query.page_size);
      if (query.sort) params = params.set('sort', query.sort);
      if (query.include) params = params.set('include', query.include);
    }

    return this.http.get<ApiResponse<MovimientoResponse[]>>(this.API_URL, { params }).pipe(
      map(res => res.data)
    );
  }

  obtenerPorId(id: string): Observable<MovimientoResponse> {
    return this.http.get<ApiResponse<MovimientoResponse>>(`${this.API_URL}/${id}`).pipe(
      map(res => res.data)
    );
  }

  aplicar(movimiento: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(this.API_URL, movimiento);
  }
}
