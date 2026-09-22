import { Routes } from '@angular/router';

export const AUDITORIA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-auditoria-list/auditoria-list.component').then(
        (m) => m.AuditoriaListComponent
      ),
  },
];
