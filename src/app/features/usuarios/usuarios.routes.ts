import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.usuarios.leer)],
    loadComponent: () =>
      import('./feature-usuario-list/usuario-list.component').then(m => m.UsuarioListComponent),
  },
  {
    path: 'roles',
    canActivate: [permissionGuard(...PERMISOS.roles.gestionar)],
    loadComponent: () => import('./feature-rol-list/rol-list.component').then(m => m.RolListComponent),
  },
];
