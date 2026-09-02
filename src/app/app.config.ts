import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { catchError, map, of, switchMap, firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { provideZard } from '@/shared/core/provider/providezard';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { AuthService } from './core/auth/api/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZard(),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return firstValueFrom(
        authService.refreshToken().pipe(
          switchMap(() => authService.loadCurrentUser()),
          catchError(() => of(null)) // Continue gracefully if no valid session
        )
      );
    })
  ]
};
