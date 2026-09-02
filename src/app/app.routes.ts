import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'inventario',
        loadChildren: () =>
          import('./features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
      },
      {
        path: 'ventas',
        loadChildren: () => import('./features/ventas/ventas.routes').then((m) => m.VENTAS_ROUTES),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'auditoria',
        loadChildren: () =>
          import('./features/auditoria/auditoria.routes').then((m) => m.AUDITORIA_ROUTES),
      },
      { path: '', redirectTo: '/ventas', pathMatch: 'full' },
    ],
  },
];
