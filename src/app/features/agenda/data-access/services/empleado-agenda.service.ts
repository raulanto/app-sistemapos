import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ApiResponse,
  EmpleadoServicioResponse,
  ExcepcionRequest,
  ExcepcionResponse,
  HorarioBaseRequest,
  HorarioBaseResponse,
} from '../agenda.models';

@Injectable({ providedIn: 'root' })
export class EmpleadoAgendaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/agenda`;

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
}
