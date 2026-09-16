import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ApiResponse,
  AsignarManualRequest,
  CancelarCitaRequest,
  CitaQuery,
  CitaResponse,
  CrearCitaRequest,
  FacturarCitaRequest,
  VentaResponse,
} from '../agenda.models';

@Injectable({ providedIn: 'root' })
export class CitaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/agenda`;

  private idemHeaders(key?: string) {
    return key ? { headers: new HttpHeaders({ 'Idempotency-Key': key }) } : {};
  }

  private toParams(query: object): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params = params.set(k, String(v));
    }
    return params;
  }

  /** Crea la cita y oferta automáticamente a todos los empleados elegibles a la vez. */
  crearCita(req: CrearCitaRequest): Observable<CitaResponse> {
    return this.http.post<ApiResponse<CitaResponse>>(`${this.API_URL}/citas`, req).pipe(map(r => r.data));
  }

  listarCitas(query: CitaQuery = {}): Observable<ApiResponse<CitaResponse[]>> {
    return this.http.get<ApiResponse<CitaResponse[]>>(`${this.API_URL}/citas`, { params: this.toParams(query) });
  }

  obtenerCita(id: string): Observable<CitaResponse> {
    return this.http.get<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}`).pipe(map(r => r.data));
  }

  /** Reintenta la búsqueda de elegibles (p.ej. tras `sin_empleado_disponible`). */
  ofertar(id: string): Observable<CitaResponse> {
    return this.http.post<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/ofertar`, {}).pipe(map(r => r.data));
  }

  /** Salta la cola de ofertas y fuerza un empleado (sigue validando calificación y disponibilidad). */
  asignarManual(id: string, req: AsignarManualRequest): Observable<CitaResponse> {
    return this.http
      .post<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/asignar-manual`, req)
      .pipe(map(r => r.data));
  }

  /** Responde por el usuario autenticado: el primero que acepta se queda la cita. */
  aceptar(id: string): Observable<CitaResponse> {
    return this.http.post<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/aceptar`, {}).pipe(map(r => r.data));
  }

  rechazar(id: string): Observable<CitaResponse> {
    return this.http.post<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/rechazar`, {}).pipe(map(r => r.data));
  }

  iniciar(id: string): Observable<CitaResponse> {
    return this.http.post<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/iniciar`, {}).pipe(map(r => r.data));
  }

  completar(id: string): Observable<CitaResponse> {
    return this.http.post<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/completar`, {}).pipe(map(r => r.data));
  }

  cancelar(id: string, req: CancelarCitaRequest = {}): Observable<CitaResponse> {
    return this.http
      .patch<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/cancelar`, req)
      .pipe(map(r => r.data));
  }

  /** Sólo desde `asignada`. Sin detección automática: siempre lo marca alguien a mano. */
  noShow(id: string): Observable<CitaResponse> {
    return this.http
      .patch<ApiResponse<CitaResponse>>(`${this.API_URL}/citas/${id}/no-show`, {})
      .pipe(map(r => r.data));
  }

  /**
   * Sólo una cita `completada` y sin facturar (409 CitaYaFacturada si ya tiene venta).
   * Arma una venta de una línea y reusa el motor de ventas: exige turno de caja abierto.
   */
  facturar(id: string, req: FacturarCitaRequest, idempotencyKey?: string): Observable<VentaResponse> {
    return this.http
      .post<ApiResponse<VentaResponse>>(`${this.API_URL}/citas/${id}/facturar`, req, this.idemHeaders(idempotencyKey))
      .pipe(map(r => r.data));
  }
}
