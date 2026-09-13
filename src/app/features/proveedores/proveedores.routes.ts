import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.proveedores.leer)],
    loadComponent: () => import('./feature-proveedor-list/proveedor-list.component').then(m => m.ProveedorListComponent),
  },
  {
    path: 'pedidos',
    canActivate: [permissionGuard(...PERMISOS.pedidoProveedor.leer)],
    loadComponent: () =>
      import('./feature-pedido-proveedor-list/pedido-proveedor-list.component').then(m => m.PedidoProveedorListComponent),
  },
  {
    path: 'pedidos/:id',
    canActivate: [permissionGuard(...PERMISOS.pedidoProveedor.leer)],
    loadComponent: () =>
      import('./feature-pedido-proveedor-detail/pedido-proveedor-detail.component').then(m => m.PedidoProveedorDetailComponent),
  },
  {
    path: 'recepciones',
    canActivate: [permissionGuard(...PERMISOS.recepcionProveedor.leer)],
    loadComponent: () =>
      import('./feature-recepcion-proveedor-list/recepcion-proveedor-list.component').then(m => m.RecepcionProveedorListComponent),
  },
  {
    path: 'recepciones/:id',
    canActivate: [permissionGuard(...PERMISOS.recepcionProveedor.leer)],
    loadComponent: () =>
      import('./feature-recepcion-proveedor-detail/recepcion-proveedor-detail.component').then(
        m => m.RecepcionProveedorDetailComponent,
      ),
  },
  {
    path: 'devoluciones',
    canActivate: [permissionGuard(...PERMISOS.devolucionProveedor.leer)],
    loadComponent: () =>
      import('./feature-devolucion-proveedor-list/devolucion-proveedor-list.component').then(
        m => m.DevolucionProveedorListComponent,
      ),
  },
  {
    path: 'devoluciones/:id',
    canActivate: [permissionGuard(...PERMISOS.devolucionProveedor.leer)],
    loadComponent: () =>
      import('./feature-devolucion-proveedor-detail/devolucion-proveedor-detail.component').then(
        m => m.DevolucionProveedorDetailComponent,
      ),
  },
  {
    path: ':id',
    canActivate: [permissionGuard(...PERMISOS.proveedores.leer)],
    loadComponent: () => import('./feature-proveedor-detail/proveedor-detail.component').then(m => m.ProveedorDetailComponent),
  },
];
