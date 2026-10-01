import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    title: 'Iniciar Sesión - Sistema POS',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Panel Principal - Sistema POS',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'usuarios',
        title: 'Gestión de Usuarios - Sistema POS',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'inventario',
        title: 'Administración de Inventario - Sistema POS',
        loadChildren: () =>
          import('./features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
      },
      {
        path: 'clientes',
        title: 'Gestión de Clientes - Sistema POS',
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
      },
      {
        path: 'ventas',
        title: 'Punto de Venta (POS) - Ventas',
        loadChildren: () => import('./features/ventas/ventas.routes').then((m) => m.VENTAS_ROUTES),
      },
      {
        path: 'pedidos',
        title: 'Gestión de Pedidos - Sistema POS',
        loadChildren: () => import('./features/pedidos/pedidos.routes').then((m) => m.PEDIDOS_ROUTES),
      },
      {
        path: 'agenda',
        title: 'Agenda y Citas - Sistema POS',
        loadChildren: () => import('./features/agenda/agenda.routes').then((m) => m.AGENDA_ROUTES),
      },
      {
        path: 'proveedores',
        title: 'Proveedores - Sistema POS',
        loadChildren: () =>
          import('./features/proveedores/proveedores.routes').then((m) => m.PROVEEDORES_ROUTES),
      },
      {
        path: 'promociones',
        title: 'Promociones y Ofertas - Sistema POS',
        loadChildren: () =>
          import('./features/promociones/promociones.routes').then((m) => m.PROMOCIONES_ROUTES),
      },
      {
        path: 'cajas',
        title: 'Control de Cajas - Sistema POS',
        loadChildren: () => import('./features/cajas/cajas.routes').then((m) => m.CAJAS_ROUTES),
      },
      {
        path: 'reportes',
        title: 'Reportes y Analíticas - Sistema POS',
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'auditoria',
        title: 'Auditoría del Sistema - POS',
        loadChildren: () =>
          import('./features/auditoria/auditoria.routes').then((m) => m.AUDITORIA_ROUTES),
      },
      {
        path: 'sucursales',
        title: 'Gestión de Sucursales - Sistema POS',
        loadChildren: () =>
          import('./features/sucursales/sucursales.routes').then((m) => m.SUCURSALES_ROUTES),
      },
      {
        path: 'ayuda',
        title: 'Centro de Ayuda - Sistema POS',
        loadChildren: () =>
          import('./features/ayuda/ayuda.routes').then((m) => m.AYUDA_ROUTES),
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      {
        path: '**',
        title: '404 - Página no encontrada',
        loadComponent: () =>
          import('./core/pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
