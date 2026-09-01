import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

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
      return throwError(() => error);
    })
  );
};
