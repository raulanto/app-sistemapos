import { Routes } from '@angular/router';

export const SUCURSALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-sucursal-list/sucursal-list.component').then(m => m.SucursalListComponent)
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./feature-sucursal-create/sucursal-create.component').then(m => m.SucursalCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./feature-sucursal-detail/sucursal-detail.component').then(m => m.SucursalDetailComponent)
  }
];
