import { Routes } from '@angular/router';

export const SUCURSALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-sucursal-list/sucursal-list.component').then(m => m.SucursalListComponent)
  }
];
