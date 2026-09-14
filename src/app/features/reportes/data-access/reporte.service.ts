import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@env/environment';
import { ApiResponse } from '@core/api.model';

import {
  ClienteConSaldoItem,
  CorteCajaReporte,
  CrearReporteProgramadoRequest,
  DashboardReporte,
  FormatoExport,
  InventarioValorizadoReporte,
  MermasAjustesReporte,
  PaginacionQuery,
  ProductoMasVendidoItem,
  RangoQuery,
  ReporteProgramadoResponse,
  VentaPorUsuarioItem,
  VentasPorMetodoPagoReporte,
  VentasReporte,
} from './reporte.models';

function buildParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== '') params = params.set(k, String(v));
  }
  return params;
}

/** Módulo de solo lectura: agrega ventas/inventario/clientes, todo bajo el permiso `reportes.leer`. */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/reportes`;

  corteCaja(cajaTurnoId: string): Observable<CorteCajaReporte> {
    return this.http
      .get<ApiResponse<CorteCajaReporte>>(`${this.API_URL}/corte-caja/${cajaTurnoId}`)
      .pipe(map(r => r.data));
  }

  ventas(query: RangoQuery = {}): Observable<VentasReporte> {
    return this.http
      .get<ApiResponse<VentasReporte>>(`${this.API_URL}/ventas`, { params: buildParams(query) })
      .pipe(map(r => r.data));
  }

  ventasPorMetodoPago(query: RangoQuery = {}): Observable<VentasPorMetodoPagoReporte> {
    return this.http
      .get<ApiResponse<VentasPorMetodoPagoReporte>>(`${this.API_URL}/ventas-por-metodo-pago`, { params: buildParams(query) })
      .pipe(map(r => r.data));
  }

  ventasPorUsuario(query: RangoQuery & PaginacionQuery = {}): Observable<ApiResponse<VentaPorUsuarioItem[]>> {
    return this.http.get<ApiResponse<VentaPorUsuarioItem[]>>(`${this.API_URL}/ventas-por-usuario`, {
      params: buildParams(query),
    });
  }

  productosMasVendidos(query: RangoQuery & PaginacionQuery = {}): Observable<ApiResponse<ProductoMasVendidoItem[]>> {
    return this.http.get<ApiResponse<ProductoMasVendidoItem[]>>(`${this.API_URL}/productos-mas-vendidos`, {
      params: buildParams(query),
    });
  }

  inventarioValorizado(query: { sucursal_id?: string; categoria_id?: string } = {}): Observable<InventarioValorizadoReporte> {
    return this.http
      .get<ApiResponse<InventarioValorizadoReporte>>(`${this.API_URL}/inventario-valorizado`, { params: buildParams(query) })
      .pipe(map(r => r.data));
  }

  mermasAjustes(query: RangoQuery = {}): Observable<MermasAjustesReporte> {
    return this.http
      .get<ApiResponse<MermasAjustesReporte>>(`${this.API_URL}/mermas-ajustes`, { params: buildParams(query) })
      .pipe(map(r => r.data));
  }

  clientesConSaldo(query: { sucursal_id?: string } & PaginacionQuery = {}): Observable<ApiResponse<ClienteConSaldoItem[]>> {
    return this.http.get<ApiResponse<ClienteConSaldoItem[]>>(`${this.API_URL}/clientes-con-saldo`, {
      params: buildParams(query),
    });
  }

  dashboard(sucursalId?: string): Observable<DashboardReporte> {
    return this.http
      .get<ApiResponse<DashboardReporte>>(`${this.API_URL}/dashboard`, { params: buildParams({ sucursal_id: sucursalId }) })
      .pipe(map(r => r.data));
  }

  /** `path` es relativo a `/reportes` (ej. "ventas", "corte-caja/<uuid>") — mismos query params que la versión JSON. */
  exportar(path: string, query: object, formato: FormatoExport): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.API_URL}/${path}`, {
      params: buildParams({ ...query, formato }),
      responseType: 'blob',
      observe: 'response',
    });
  }

  programadosListar(query: PaginacionQuery = {}): Observable<ApiResponse<ReporteProgramadoResponse[]>> {
    return this.http.get<ApiResponse<ReporteProgramadoResponse[]>>(`${this.API_URL}/programados`, { params: buildParams(query) });
  }

  programadosCrear(req: CrearReporteProgramadoRequest): Observable<ReporteProgramadoResponse> {
    return this.http.post<ApiResponse<ReporteProgramadoResponse>>(`${this.API_URL}/programados`, req).pipe(map(r => r.data));
  }

  programadosSetActivo(id: string, activo: boolean): Observable<ReporteProgramadoResponse> {
    return this.http
      .patch<ApiResponse<ReporteProgramadoResponse>>(`${this.API_URL}/programados/${id}/activo`, { activo })
      .pipe(map(r => r.data));
  }

  programadosEliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/programados/${id}`);
  }
}
