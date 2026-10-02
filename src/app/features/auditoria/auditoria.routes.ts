import { Routes } from '@angular/router';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISOS } from '@core/auth/permissions';

export const AUDITORIA_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.auditoria.leer)],
    loadComponent: () =>
      import('./feature-auditoria-list/auditoria-list.component').then(
        (m) => m.AuditoriaListComponent
      ),
  },
];
