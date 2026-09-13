import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const AGENDA_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.agenda.verPropias)],
    loadComponent: () => import('./feature-cita-list/cita-list.component').then(m => m.CitaListComponent),
  },
  {
    path: 'catalogo',
    canActivate: [permissionGuard(...PERMISOS.agenda.administrar)],
    loadComponent: () =>
      import('./feature-agenda-catalogo/agenda-catalogo.component').then(m => m.AgendaCatalogoComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard(...PERMISOS.agenda.verPropias)],
    loadComponent: () => import('./feature-cita-detail/cita-detail.component').then(m => m.CitaDetailComponent),
  },
];
