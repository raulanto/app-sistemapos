import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.clientes.leer)],
    loadComponent: () =>
      import('./feature-cliente-list/cliente-list.component').then(m => m.ClienteListComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard(...PERMISOS.clientes.leer)],
    loadComponent: () =>
      import('./feature-cliente-detail/cliente-detail.component').then(m => m.ClienteDetailComponent),
  },
];
