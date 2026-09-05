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
  ProductoQuery,
  ProductoKpiResponse,
  ComponenteResponse,
  AgregarComponenteRequest,
  ActualizarComponenteRequest,
  UnidadResponse,
  AgregarUnidadRequest,
  ActualizarUnidadRequest,
  ResolucionCodigoResponse,
  ImagenResponse,
  AgregarImagenRequest,
  ActualizarImagenRequest,
  ReemplazarRecetaRequest
} from './inventario.models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario/productos`;

  private buildParams(query?: ProductoQuery): HttpParams {
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
    return params;
  }

  listar(query?: ProductoQuery): Observable<ApiResponse<ProductoResponse[]>> {
    const params = this.buildParams(query);
    return this.http.get<ApiResponse<ProductoResponse[]>>(this.API_URL, { params });
  }

  obtenerKpis(query?: ProductoQuery): Observable<ProductoKpiResponse> {
    const params = this.buildParams(query);
    return this.http.get<ApiResponse<ProductoKpiResponse>>(`${this.API_URL}/kpis`, { params }).pipe(
      map(res => res.data)
    );
  }

  /** Escaneo POS: resuelve un código de barras a producto/presentación + factor + precio. */
  resolverCodigo(codigo_barras: string): Observable<ResolucionCodigoResponse> {
    const params = new HttpParams().set('codigo_barras', codigo_barras);
    return this.http
      .get<ApiResponse<ResolucionCodigoResponse>>(`${this.API_URL}/resolver-codigo`, { params })
      .pipe(map(res => res.data));
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

  desactivar(id: string, confirmarConStock = false): Observable<void> {
    let params = new HttpParams();
    if (confirmarConStock) {
      params = params.set('confirmar_con_stock', 'true');
    }
    return this.http.patch<void>(`${this.API_URL}/${id}/desactivar`, {}, { params });
  }

  activar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/activar`, {});
  }

  // --- COMPONENTES DE KIT ---

  listarComponentes(kit_id: string, include?: string): Observable<ComponenteResponse[]> {
    let params = new HttpParams();
    if (include) {
      params = params.set('include', include);
    }
    return this.http.get<ApiResponse<ComponenteResponse[]>>(`${this.API_URL}/${kit_id}/componentes`, { params }).pipe(
      map(res => res.data)
    );
  }

  agregarComponente(kit_id: string, request: AgregarComponenteRequest): Observable<ComponenteResponse> {
    return this.http.post<ApiResponse<ComponenteResponse>>(`${this.API_URL}/${kit_id}/componentes`, request).pipe(
      map(res => res.data)
    );
  }

  /** Reemplaza la receta completa del kit en una sola llamada atómica. */
  reemplazarReceta(kit_id: string, request: ReemplazarRecetaRequest): Observable<ComponenteResponse[]> {
    return this.http.put<ApiResponse<ComponenteResponse[]>>(`${this.API_URL}/${kit_id}/componentes`, request).pipe(
      map(res => res.data)
    );
  }

  actualizarComponente(kit_id: string, componente_id: string, request: ActualizarComponenteRequest): Observable<ComponenteResponse> {
    return this.http.patch<ApiResponse<ComponenteResponse>>(`${this.API_URL}/${kit_id}/componentes/${componente_id}`, request).pipe(
      map(res => res.data)
    );
  }

  quitarComponente(kit_id: string, componente_id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${kit_id}/componentes/${componente_id}`);
  }

  // --- UMBRALES ---

  actualizarUmbrales(producto_id: string, sucursal_id: string, umbrales: { stock_minimo: number; stock_maximo?: number }): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/inventario/existencias/${producto_id}/${sucursal_id}/umbrales`, umbrales);
  }

  // --- PRESENTACIONES (UNIDADES) ---

  listarUnidades(producto_id: string, incluir_inactivas: boolean = false): Observable<UnidadResponse[]> {
    let params = new HttpParams();
    if (incluir_inactivas) {
      params = params.set('incluir_inactivas', 'true');
    }
    return this.http.get<ApiResponse<UnidadResponse[]>>(`${this.API_URL}/${producto_id}/unidades`, { params }).pipe(
      map(res => res.data)
    );
  }

  agregarUnidad(producto_id: string, request: AgregarUnidadRequest): Observable<UnidadResponse> {
    return this.http.post<ApiResponse<UnidadResponse>>(`${this.API_URL}/${producto_id}/unidades`, request).pipe(
      map(res => res.data)
    );
  }

  actualizarUnidad(producto_id: string, unidad_id: string, request: ActualizarUnidadRequest): Observable<UnidadResponse> {
    return this.http.patch<ApiResponse<UnidadResponse>>(`${this.API_URL}/${producto_id}/unidades/${unidad_id}`, request).pipe(
      map(res => res.data)
    );
  }

  eliminarUnidad(producto_id: string, unidad_id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${producto_id}/unidades/${unidad_id}`);
  }

  // --- IMÁGENES (galería del producto) ---

  listarImagenes(producto_id: string): Observable<ImagenResponse[]> {
    return this.http.get<ApiResponse<ImagenResponse[]>>(`${this.API_URL}/${producto_id}/imagenes`).pipe(
      map(res => res.data)
    );
  }

  agregarImagen(producto_id: string, request: AgregarImagenRequest): Observable<ImagenResponse> {
    return this.http.post<ApiResponse<ImagenResponse>>(`${this.API_URL}/${producto_id}/imagenes`, request).pipe(
      map(res => res.data)
    );
  }

  actualizarImagen(producto_id: string, imagen_id: string, request: ActualizarImagenRequest): Observable<ImagenResponse> {
    return this.http.patch<ApiResponse<ImagenResponse>>(`${this.API_URL}/${producto_id}/imagenes/${imagen_id}`, request).pipe(
      map(res => res.data)
    );
  }

  eliminarImagen(producto_id: string, imagen_id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${producto_id}/imagenes/${imagen_id}`);
  }

  // --- IMÁGENES de una presentación (producto_unidad) ---

  listarImagenesUnidad(producto_id: string, unidad_id: string): Observable<ImagenResponse[]> {
    return this.http.get<ApiResponse<ImagenResponse[]>>(`${this.API_URL}/${producto_id}/unidades/${unidad_id}/imagenes`).pipe(
      map(res => res.data)
    );
  }

  agregarImagenUnidad(producto_id: string, unidad_id: string, request: AgregarImagenRequest): Observable<ImagenResponse> {
    return this.http.post<ApiResponse<ImagenResponse>>(`${this.API_URL}/${producto_id}/unidades/${unidad_id}/imagenes`, request).pipe(
      map(res => res.data)
    );
  }

  actualizarImagenUnidad(producto_id: string, unidad_id: string, imagen_id: string, request: ActualizarImagenRequest): Observable<ImagenResponse> {
    return this.http.patch<ApiResponse<ImagenResponse>>(`${this.API_URL}/${producto_id}/unidades/${unidad_id}/imagenes/${imagen_id}`, request).pipe(
      map(res => res.data)
    );
  }

  eliminarImagenUnidad(producto_id: string, unidad_id: string, imagen_id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${producto_id}/unidades/${unidad_id}/imagenes/${imagen_id}`);
  }
}
