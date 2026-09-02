import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, filter, finalize, map, shareReplay, take, tap, switchMap } from 'rxjs/operators';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { ApiResponse, LoginRequest, PermisoResponse, TokenResponse, UsuarioResponse } from '../models/auth.models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = environment.apiUrl;

  /**
   * El backend entrega el `refresh_token` en el body (no como cookie httpOnly),
   * así que lo persistimos para poder restaurar la sesión al recargar la página.
   * Nota: localStorage es accesible por JS -> vulnerable a XSS. Es el modelo que
   * impone la API; mitigar con CSP y sanitización.
   */
  private readonly REFRESH_TOKEN_KEY = 'pos.refresh_token';

  readonly accessToken = signal<string | null>(null);
  readonly currentUser = signal<UsuarioResponse | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  
  readonly sessionResolved = signal<boolean>(false);
  readonly isReady = computed(() => this.sessionResolved());

  /** Se emite una sola vez, cuando el refresh de arranque termina (con o sin sesión). */
  private readonly sessionResolved$ = toObservable(this.sessionResolved).pipe(
    filter(resolved => resolved),
    take(1)
  );

  /** Refresh en curso compartido: evita disparar varios /refresh en paralelo (la rotación de tokens los invalidaría entre sí). */
  private refreshInFlight$: Observable<TokenResponse> | null = null;

  /** Resuelve cuando el intento de restaurar sesión al cargar la app ha finalizado. */
  ensureSessionResolved(): Promise<void> {
    if (this.sessionResolved()) {
      return Promise.resolve();
    }
    return firstValueFrom(this.sessionResolved$).then(() => undefined);
  }

  readonly permisos = computed(() => new Set((this.currentUser()?.rol?.permisos ?? []).map((p: PermisoResponse) => p.codigo)));

  /** True si el usuario tiene al menos uno de los códigos indicados (permite convenciones equivalentes). */
  hasPermission(...codigos: string[]): boolean {
    const permisos = this.permisos();
    return codigos.some(codigo => permisos.has(codigo));
  }

  getStoredRefreshToken(): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(this.REFRESH_TOKEN_KEY) : null;
    } catch {
      return null;
    }
  }

  private setStoredRefreshToken(token: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
      }
    } catch {
      /* almacenamiento no disponible (modo privado, cuota, SSR) */
    }
  }

  private clearStoredRefreshToken(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API_URL}/usuarios/login`, credentials, { withCredentials: true }).pipe(
      tap(response => {
        this.accessToken.set(response.access_token);
        this.setStoredRefreshToken(response.refresh_token);
      }),
      switchMap(response => this.loadCurrentUser().pipe(map(() => response)))
    );
  }

  logout(): void {
    // Deslogueo local: limpiamos estado + refresh token persistido y redirigimos.
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  logoutRemote(): Observable<void> {
    const refreshToken = this.getStoredRefreshToken() ?? '';
    return this.http.post<void>(`${this.API_URL}/usuarios/logout`, { refresh_token: refreshToken }, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
      })
    );
  }

  refreshToken(): Observable<TokenResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      // No hay sesión que restaurar: marcamos como resuelto y salimos.
      this.sessionResolved.set(true);
      this.clearSession();
      return throwError(() => new Error('No hay refresh token almacenado'));
    }

    this.refreshInFlight$ = this.http.post<TokenResponse>(`${this.API_URL}/usuarios/refresh`, { refresh_token: refreshToken }, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.accessToken.set(response.access_token);
        // Rotación: el backend devuelve un refresh token nuevo en cada refresh.
        this.setStoredRefreshToken(response.refresh_token);
        this.isAuthenticated.set(true);
      }),
      catchError((error: HttpErrorResponse) => {
        // Solo cerramos sesión si el backend dice explícitamente que no estás autenticado.
        // Un fallo de red o un 5xx transitorio NO debe expulsar al usuario.
        if (error.status === 401 || error.status === 403) {
          this.clearSession();
        }
        return throwError(() => error);
      }),
      finalize(() => {
        this.sessionResolved.set(true);
        this.refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.refreshInFlight$;
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
    this.clearStoredRefreshToken();
  }
}
