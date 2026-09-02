import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, tap, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ApiResponse, LoginRequest, PermisoResponse, TokenResponse, UsuarioResponse } from '../models/auth.models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = environment.apiUrl;

  readonly accessToken = signal<string | null>(null);
  readonly currentUser = signal<UsuarioResponse | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  
  readonly sessionResolved = signal<boolean>(false);
  readonly isReady = computed(() => this.sessionResolved());

  readonly permisos = computed(() => new Set((this.currentUser()?.rol?.permisos ?? []).map((p: PermisoResponse) => p.codigo)));

  /** True si el usuario tiene al menos uno de los códigos indicados (permite convenciones equivalentes). */
  hasPermission(...codigos: string[]): boolean {
    const permisos = this.permisos();
    return codigos.some(codigo => permisos.has(codigo));
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API_URL}/usuarios/login`, credentials, { withCredentials: true }).pipe(
      tap(response => this.accessToken.set(response.access_token)),
      switchMap(response => this.loadCurrentUser().pipe(map(() => response)))
    );
  }

  logout(): void {
    // Para desloguear localmente limpiamos estado y redirigimos
    // Idealmente el backend debe limpiar la cookie httpOnly en un endpoint /auth/logout
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  logoutRemote(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/usuarios/logout`, { refresh_token: '' }, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
      })
    );
  }

  refreshToken(): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API_URL}/usuarios/refresh`, { refresh_token: '' }, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.accessToken.set(response.access_token);
        this.isAuthenticated.set(true);
      }),
      finalize(() => this.sessionResolved.set(true)),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  loadCurrentUser(): Observable<UsuarioResponse> {
    const params = new HttpParams().set('include', 'rol');
    return this.http.get<ApiResponse<UsuarioResponse>>(`${this.API_URL}/usuarios/me`, { params }).pipe(
      map(res => res.data),
      tap(user => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      })
    );
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}
