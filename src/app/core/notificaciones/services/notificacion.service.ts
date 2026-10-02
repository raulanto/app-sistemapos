import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/api/auth.service';
import { Notificacion, ResumenNotificaciones } from '../models/notificacion.model';
import { ApiResponse } from '../../api.model';
import { SignalsService } from '../../signals/services/signals.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  private http = inject(HttpClient);
  private signalsService = inject(SignalsService);
  private sonner = inject(ZardSonnerService);

  private readonly API_URL = `${environment.apiUrl}/notificaciones`;

  readonly unreadCount = signal<number>(0);
  readonly notificaciones = signal<Notificacion[]>([]);
  readonly loading = signal<boolean>(false);

  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    this.iniciarListeners();
  }

  private iniciarListeners() {
    // Conectar al canal global de notificaciones
    this.signalsService.conectar('notificaciones');

    // 1. Escuchar el evento de nueva notificación
    this.signalsService.escucharEvento<Notificacion>('NuevaNotificacion').subscribe((signal) => {
      if (signal.data) {
        this.unreadCount.update((count) => count + 1);
        this.notificaciones.update((list) => {
          if (list.find(n => n.id === signal.data!.id)) return list;
          return [signal.data!, ...list];
        });
        this.sonner.info(signal.data.titulo, {
          description: signal.data.mensaje,
        });
      }
    });

    // 2. Escuchar evento de sesión invalidada
    this.signalsService.escucharEvento<{ id?: string; usuario_id?: string; motivo?: string }>('SesionInvalida').subscribe((signal) => {
      this.sonner.error('Sesión finalizada', {
        description: signal.data?.motivo || 'Se ha iniciado sesión en otro navegador o dispositivo.',
      });
      this.authService.clearSession();
      this.router.navigate(['/auth/login']);
    });
  }

  cargarResumen(): Observable<ApiResponse<ResumenNotificaciones>> {
    return this.http.get<ApiResponse<ResumenNotificaciones>>(`${this.API_URL}/resumen`).pipe(
      tap((res) => {
        if (res.data) {
          this.unreadCount.set(res.data.unread_count);
        }
      })
    );
  }

  cargarNotificaciones(leida?: boolean): Observable<ApiResponse<Notificacion[]>> {
    this.loading.set(true);
    let params: any = { page_size: 50 };
    if (leida !== undefined) {
      params.leida = leida;
    }
    return this.http.get<ApiResponse<Notificacion[]>>(this.API_URL, { params }).pipe(
      tap((res) => {
        if (res.data) {
          this.notificaciones.set(res.data);
        }
        this.loading.set(false);
      })
    );
  }

  marcarComoLeida(id: string): Observable<ApiResponse<Notificacion>> {
    return this.http.patch<ApiResponse<Notificacion>>(`${this.API_URL}/${id}/marcar-leida`, {}).pipe(
      tap(() => {
        this.notificaciones.update((list) =>
          list.map((n) => (n.id === id ? { ...n, leida: true, fecha_leida: new Date().toISOString() } : n))
        );
        this.unreadCount.update((count) => Math.max(0, count - 1));
      })
    );
  }

  marcarTodasComoLeidas(): Observable<ApiResponse<{ message: string; count: number }>> {
    return this.http.patch<ApiResponse<{ message: string; count: number }>>(`${this.API_URL}/marcar-todas-leidas`, {}).pipe(
      tap(() => {
        this.notificaciones.update((list) => list.map((n) => ({ ...n, leida: true })));
        this.unreadCount.set(0);
      })
    );
  }
}
