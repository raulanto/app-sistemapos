import { Routes } from '@angular/router';

export const AYUDA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-ayuda-center/ayuda-center.component').then((m) => m.AyudaCenterComponent),
  },
];
