import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full'
  },
  {
    path: 'productos',
    loadComponent: () => import('./feature-producto-list/producto-list.component').then(m => m.ProductoListComponent)
  },
  {
    path: 'productos/nuevo',
    loadComponent: () => import('./feature-producto-form/producto-form.component').then(m => m.ProductoFormComponent)
  },
  {
    path: 'productos/:id',
    loadComponent: () => import('./feature-producto-form/producto-form.component').then(m => m.ProductoFormComponent)
  },
  {
    path: 'categorias',
    loadComponent: () => import('./feature-categoria-list/categoria-list.component').then(m => m.CategoriaListComponent)
  }
];
