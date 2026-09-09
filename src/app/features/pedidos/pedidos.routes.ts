import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const PEDIDOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.pedidos.leer)],
    loadComponent: () => import('./feature-pedido-list/pedido-list.component').then(m => m.PedidoListComponent),
  },
  {
    path: 'nuevo',
    canActivate: [permissionGuard(...PERMISOS.pedidos.crear)],
    loadComponent: () => import('./feature-pedido-form/pedido-form.component').then(m => m.PedidoFormComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard(...PERMISOS.pedidos.leer)],
    loadComponent: () => import('./feature-pedido-detail/pedido-detail.component').then(m => m.PedidoDetailComponent),
  },
  {
    path: ':id/editar',
    canActivate: [permissionGuard(...PERMISOS.pedidos.editar)],
    loadComponent: () => import('./feature-pedido-form/pedido-form.component').then(m => m.PedidoFormComponent),
  },
];
