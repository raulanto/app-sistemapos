import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  AsignarManualRequest,
  CancelarCitaRequest,
  CitaQuery,
  CitaResponse,
  CrearCitaRequest,
  EmpleadoServicioResponse,
  ExcepcionRequest,
  ExcepcionResponse,
  FacturarCitaRequest,
  HorarioBaseRequest,
  HorarioBaseResponse,
  HorarioRecursoRequest,
  HorarioRecursoResponse,
  RecursoCreateRequest,
  RecursoQuery,
  RecursoRenameRequest,
  RecursoResponse,
  VentaResponse,
} from './agenda.models';

/**
 * Agenda / citas (`/api/v1/agenda`). Recursos y empleados son el catálogo;
 * una cita se crea, se oferta a los empleados calificados y libres, el
 * primero que acepta se la queda, y al completarla se factura como venta
 * normal (ver `PedidoService.facturar` para el mismo patrón).
 */
@Injectable({ providedIn: 'root' })
export class AgendaService {
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

  // --- Recursos ---

  crearRecurso(req: RecursoCreateRequest): Observable<RecursoResponse> {
    return this.http
      .post<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos`, req)
      .pipe(map(r => r.data));
  }

  listarRecursos(query: RecursoQuery = {}): Observable<RecursoResponse[]> {
    return this.http
      .get<ApiResponse<RecursoResponse[]>>(`${this.API_URL}/recursos`, { params: this.toParams(query) })
      .pipe(map(r => r.data));
  }

  renombrarRecurso(id: string, req: RecursoRenameRequest): Observable<RecursoResponse> {
    return this.http
      .patch<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos/${id}`, req)
      .pipe(map(r => r.data));
  }

  /** Soft delete: desactiva el recurso (409 NombreRecursoEnUso lo bloquea si el nombre choca al reactivar). */
  eliminarRecurso(id: string): Observable<RecursoResponse> {
    return this.http.delete<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos/${id}`).pipe(map(r => r.data));
  }

  reactivarRecurso(id: string): Observable<RecursoResponse> {
    return this.http
      .patch<ApiResponse<RecursoResponse>>(`${this.API_URL}/recursos/${id}/reactivar`, {})
      .pipe(map(r => r.data));
  }

  crearHorarioRecurso(recursoId: string, req: HorarioRecursoRequest): Observable<HorarioRecursoResponse> {
    return this.http
      .post<ApiResponse<HorarioRecursoResponse>>(`${this.API_URL}/recursos/${recursoId}/horarios`, req)
      .pipe(map(r => r.data));
  }

  listarHorariosRecurso(recursoId: string): Observable<HorarioRecursoResponse[]> {
    return this.http
      .get<ApiResponse<HorarioRecursoResponse[]>>(`${this.API_URL}/recursos/${recursoId}/horarios`)
      .pipe(map(r => r.data));
  }

  // --- Empleados ---

  calificarEmpleado(empleadoId: string, servicioId: string): Observable<EmpleadoServicioResponse> {
    const params = new HttpParams().set('servicio_id', servicioId);
    return this.http
      .post<ApiResponse<EmpleadoServicioResponse>>(`${this.API_URL}/empleados/${empleadoId}/servicios`, null, { params })
      .pipe(map(r => r.data));
  }

  listarServiciosEmpleado(empleadoId: string): Observable<EmpleadoServicioResponse[]> {
    return this.http
      .get<ApiResponse<EmpleadoServicioResponse[]>>(`${this.API_URL}/empleados/${empleadoId}/servicios`)
      .pipe(map(r => r.data));
  }

  quitarServicioEmpleado(empleadoId: string, servicioId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.API_URL}/empleados/${empleadoId}/servicios/${servicioId}`)
      .pipe(map(() => undefined));
  }

  crearHorarioEmpleado(empleadoId: string, req: HorarioBaseRequest): Observable<HorarioBaseResponse> {
    return this.http
      .post<ApiResponse<HorarioBaseResponse>>(`${this.API_URL}/empleados/${empleadoId}/horarios`, req)
      .pipe(map(r => r.data));
  }

  /** El propio empleado puede verlo (`citas.ver_propias`); sólo `agenda.administrar` lo edita. */
  listarHorariosEmpleado(empleadoId: string): Observable<HorarioBaseResponse[]> {
    return this.http
      .get<ApiResponse<HorarioBaseResponse[]>>(`${this.API_URL}/empleados/${empleadoId}/horarios`)
      .pipe(map(r => r.data));
  }

  eliminarHorarioEmpleado(empleadoId: string, horarioId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.API_URL}/empleados/${empleadoId}/horarios/${horarioId}`)
      .pipe(map(() => undefined));
  }

  crearExcepcion(empleadoId: string, req: ExcepcionRequest): Observable<ExcepcionResponse> {
    return this.http
      .post<ApiResponse<ExcepcionResponse>>(`${this.API_URL}/empleados/${empleadoId}/excepciones`, req)
      .pipe(map(r => r.data));
  }

  listarExcepciones(empleadoId: string, fecha: string): Observable<ExcepcionResponse[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http
      .get<ApiResponse<ExcepcionResponse[]>>(`${this.API_URL}/empleados/${empleadoId}/excepciones`, { params })
      .pipe(map(r => r.data));
  }

  eliminarExcepcion(empleadoId: string, excepcionId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.API_URL}/empleados/${empleadoId}/excepciones/${excepcionId}`)
      .pipe(map(() => undefined));
  }

  // --- Citas ---

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
