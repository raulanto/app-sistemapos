import { Routes } from '@angular/router';

export const CONFIGURACION_ROUTES: Routes = [
  {
    path: '',
    title: 'Configuración del Layout - Sistema POS',
    loadComponent: () =>
      import('./feature-layout-config/layout-config-page.component').then(
        (m) => m.LayoutConfigPageComponent
      ),
  },
];
