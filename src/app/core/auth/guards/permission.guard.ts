import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ZardSonnerService } from '@/shared/components/sonner/sonner.service';

import { AuthService } from '../api/auth.service';

/**
 * Guard de ruta parametrizable por permiso. Acepta uno o varios códigos
 * equivalentes (ver core/auth/permissions.ts) y aprueba si el usuario tiene
 * al menos uno.
 */
export function permissionGuard(...codigos: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const sonner = inject(ZardSonnerService);

    if (authService.hasPermission(...codigos)) {
      return true;
    }

    sonner.error('No tienes permiso para acceder a esta sección');
    return router.createUrlTree(['/']);
  };
}
