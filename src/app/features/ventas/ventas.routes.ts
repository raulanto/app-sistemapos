import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.ventas.crear)],
    loadComponent: () => import('./feature-pos/pos.component').then(m => m.PosComponent),
  },
  {
    path: 'historial',
    canActivate: [permissionGuard(...PERMISOS.ventas.leer)],
    loadComponent: () => import('./feature-ventas-list/ventas-list.component').then(m => m.VentasListComponent),
  },
  {
    path: 'historial/:id',
    canActivate: [permissionGuard(...PERMISOS.ventas.leer)],
    loadComponent: () => import('./feature-venta-detail/venta-detail.component').then(m => m.VentaDetailComponent),
  },
];
