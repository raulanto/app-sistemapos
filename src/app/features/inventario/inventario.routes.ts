import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full'
  },
  {
    path: 'productos',
    canActivate: [permissionGuard(...PERMISOS.inventario.leer)],
    loadComponent: () => import('./feature-producto-list/producto-list.component').then(m => m.ProductoListComponent)
  },
  {
    path: 'productos/nuevo',
    canActivate: [permissionGuard(...PERMISOS.inventario.crear)],
    loadComponent: () => import('./feature-producto-create/producto-create.component').then(m => m.ProductoCreateComponent)
  },
  {
    path: 'productos/:id',
    canActivate: [permissionGuard(...PERMISOS.inventario.leer)],
    loadComponent: () => import('./feature-producto-detail/producto-detail.component').then(m => m.ProductoDetailComponent)
  },
  {
    path: 'categorias',
    canActivate: [permissionGuard(...PERMISOS.inventario.leer)],
    loadComponent: () => import('./feature-categoria-list/categoria-list.component').then(m => m.CategoriaListComponent)
  }
];
