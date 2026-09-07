import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const PROMOCIONES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.promociones.leer)],
    loadComponent: () =>
      import('./feature-promocion-list/promocion-list.component').then(m => m.PromocionListComponent),
  },
];
