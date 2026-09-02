import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '@/core/auth/api/auth.service';
import { ZardSonnerService } from '@/shared/components/sonner/sonner.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const sonner = inject(ZardSonnerService);

  // Skip adding token for login and refresh endpoints
  if (req.url.includes('/usuarios/login') || req.url.includes('/usuarios/refresh')) {
    const clonedReq = req.clone({ withCredentials: true });
    return next(clonedReq);
  }

  const token = authService.accessToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
      withCredentials: true
    });
  } else {
    authReq = req.clone({
      withCredentials: true
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/usuarios/refresh')) {
        return authService.refreshToken().pipe(
          switchMap((tokenResponse) => {
            const retryReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${tokenResponse.access_token}`),
              withCredentials: true
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            authService.clearSession();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }
      if (error.status === 403) {
        sonner.error('No tienes permiso para realizar esta acción');
      }
      return throwError(() => error);
    })
  );
};
