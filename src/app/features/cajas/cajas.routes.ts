import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const CAJAS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.caja.operar)],
    loadComponent: () =>
      import('./feature-caja-list/caja-list.component').then(m => m.CajaListComponent),
  },
];
