import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  AbrirTurnoRequest,
  CerrarTurnoRequest,
  ConciliarTurnoRequest,
  CajaResponse,
  CrearCajaRequest,
  ActualizarCajaRequest,
  CajaTurnoResponse,
  ResumenTurnoResponse,
  MovimientoCajaResponse,
  CrearMovimientoCajaRequest,
  TurnoHistoricoQuery,
  EfectivoActualResponse,
} from './ventas.models';

/**
 * Cajas físicas (terminales) y turnos de caja. La sucursal sale del usuario autenticado.
 * Turno: `caja.operar` (o `ventas.crear`). Terminales: `caja.administrar`.
 */
@Injectable({ providedIn: 'root' })
export class CajaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/caja-turnos`;
  private readonly CAJAS_URL = `${environment.apiUrl}/cajas`;

  // --- Terminales ---

  listarCajas(incluirInactivas = false): Observable<CajaResponse[]> {
    const params = new HttpParams().set('incluir_inactivas', String(incluirInactivas));
    return this.http.get<ApiResponse<CajaResponse[]>>(this.CAJAS_URL, { params }).pipe(map(r => r.data));
  }

  crearCaja(req: CrearCajaRequest): Observable<CajaResponse> {
    return this.http.post<ApiResponse<CajaResponse>>(this.CAJAS_URL, req).pipe(map(r => r.data));
  }

  renombrarCaja(cajaId: string, req: ActualizarCajaRequest): Observable<CajaResponse> {
    return this.http.patch<ApiResponse<CajaResponse>>(`${this.CAJAS_URL}/${cajaId}`, req).pipe(map(r => r.data));
  }

  desactivarCaja(cajaId: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.CAJAS_URL}/${cajaId}`).pipe(map(() => void 0));
  }

  reactivarCaja(cajaId: string): Observable<CajaResponse> {
    return this.http.patch<ApiResponse<CajaResponse>>(`${this.CAJAS_URL}/${cajaId}/reactivar`, {}).pipe(map(r => r.data));
  }

  // --- Turnos ---

  abrir(req: AbrirTurnoRequest): Observable<CajaTurnoResponse> {
    return this.http.post<ApiResponse<CajaTurnoResponse>>(`${this.API_URL}/abrir`, req).pipe(map(r => r.data));
  }

  /** Turno abierto del cajero, o `null` si no hay (la API responde 404). */
  actual(): Observable<CajaTurnoResponse | null> {
    return this.http.get<ApiResponse<CajaTurnoResponse>>(`${this.API_URL}/actual`).pipe(
      map(r => r.data),
      catchError(err => (err?.status === 404 ? of(null) : throwError(() => err))),
    );
  }

  resumen(turnoId: string): Observable<ResumenTurnoResponse> {
    return this.http.get<ApiResponse<ResumenTurnoResponse>>(`${this.API_URL}/${turnoId}`).pipe(map(r => r.data));
  }

  cerrar(turnoId: string, req: CerrarTurnoRequest): Observable<CajaTurnoResponse> {
    return this.http
      .post<ApiResponse<CajaTurnoResponse>>(`${this.API_URL}/${turnoId}/cerrar`, req)
      .pipe(map(r => r.data));
  }

  conciliar(turnoId: string, req: ConciliarTurnoRequest): Observable<CajaTurnoResponse> {
    return this.http
      .post<ApiResponse<CajaTurnoResponse>>(`${this.API_URL}/${turnoId}/conciliar`, req)
      .pipe(map(r => r.data));
  }

  // --- Movimientos de caja (retiro / ingreso / gasto) ---

  movimientos(turnoId: string): Observable<MovimientoCajaResponse[]> {
    return this.http
      .get<ApiResponse<MovimientoCajaResponse[]>>(`${this.API_URL}/${turnoId}/movimientos`)
      .pipe(map(r => r.data));
  }

  registrarMovimiento(turnoId: string, req: CrearMovimientoCajaRequest): Observable<MovimientoCajaResponse> {
    return this.http
      .post<ApiResponse<MovimientoCajaResponse>>(`${this.API_URL}/${turnoId}/movimientos`, req)
      .pipe(map(r => r.data));
  }

  // --- Histórico / efectivo en tiempo real ---

  historico(query: TurnoHistoricoQuery = {}): Observable<ApiResponse<CajaTurnoResponse[]>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<ApiResponse<CajaTurnoResponse[]>>(`${this.API_URL}/historico`, { params });
  }

  efectivoActual(sucursalId?: string): Observable<EfectivoActualResponse> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursal_id', sucursalId);
    return this.http
      .get<ApiResponse<EfectivoActualResponse>>(`${this.API_URL}/efectivo-actual`, { params })
      .pipe(map(r => r.data));
  }
}
