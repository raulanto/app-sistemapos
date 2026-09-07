import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  AbrirTurnoRequest,
  CerrarTurnoRequest,
  CajaTurnoResponse,
  ResumenTurnoResponse,
} from './ventas.models';

/**
 * Turnos de caja. La sucursal sale del usuario autenticado.
 * Permiso: `ventas.crear` (no hay permiso propio de caja).
 */
@Injectable({ providedIn: 'root' })
export class CajaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/caja-turnos`;

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
}
