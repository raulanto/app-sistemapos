import { Routes } from '@angular/router';

import { permissionGuard } from '@/core/auth/guards/permission.guard';
import { PERMISOS } from '@/core/auth/permissions';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard(...PERMISOS.reportes.leer)],
    loadComponent: () => import('./feature-reportes-shell/reportes-shell.component').then(m => m.ReportesShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./feature-reporte-dashboard/reporte-dashboard.component').then(m => m.ReporteDashboardComponent),
      },
      { path: 'ventas', loadComponent: () => import('./feature-reporte-ventas/reporte-ventas.component').then(m => m.ReporteVentasComponent) },
      {
        path: 'metodos-pago',
        loadComponent: () => import('./feature-reporte-metodos-pago/reporte-metodos-pago.component').then(m => m.ReporteMetodosPagoComponent),
      },
      {
        path: 'vendedores',
        loadComponent: () => import('./feature-reporte-vendedores/reporte-vendedores.component').then(m => m.ReporteVendedoresComponent),
      },
      {
        path: 'productos',
        loadComponent: () => import('./feature-reporte-productos/reporte-productos.component').then(m => m.ReporteProductosComponent),
      },
      {
        path: 'inventario',
        loadComponent: () => import('./feature-reporte-inventario/reporte-inventario.component').then(m => m.ReporteInventarioComponent),
      },
      { path: 'mermas', loadComponent: () => import('./feature-reporte-mermas/reporte-mermas.component').then(m => m.ReporteMermasComponent) },
      {
        path: 'clientes',
        loadComponent: () => import('./feature-reporte-clientes/reporte-clientes.component').then(m => m.ReporteClientesComponent),
      },
      {
        path: 'corte-caja',
        loadComponent: () => import('./feature-reporte-corte-caja/reporte-corte-caja.component').then(m => m.ReporteCorteCajaComponent),
      },
      {
        path: 'programados',
        canActivate: [permissionGuard(...PERMISOS.reportes.programar)],
        loadComponent: () => import('./feature-reporte-programados/reporte-programados.component').then(m => m.ReporteProgramadosComponent),
      },
    ],
  },
];
