import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideBoxes,
  lucideCalendarDays,
  lucideCreditCard,
  lucideDollarSign,
  lucideLandmark,
  lucideLayers,
  lucidePercent,
  lucideReceiptText,
  lucideTag,
  lucideTrendingUp,
  lucideTrophy,
  lucideUsers,
  lucideWallet,
} from '@ng-icons/lucide';

import { ZardCardImports } from '@/shared/components/card/card.imports';

export type ReporteKpiTono = 'default' | 'accent' | 'positive' | 'warning';

export interface ReporteKpi {
  label: string;
  value: string;
  caption?: string;
  icon?: string;
  tono?: ReporteKpiTono;
  /** Tile destacado: ocupa más espacio y valor más grande (para el KPI principal de la vista). */
  destacado?: boolean;
}

/** Grid de tarjetas KPI reutilizado por cada vista de reportes: mismo look, distintos datos. */
@Component({
  selector: 'app-reporte-kpi-grid',
  standalone: true,
  imports: [NgIcon, ...ZardCardImports],
  viewProviders: [
    provideIcons({
      lucideAlertTriangle,
      lucideBoxes,
      lucideCalendarDays,
      lucideCreditCard,
      lucideDollarSign,
      lucideLandmark,
      lucideLayers,
      lucidePercent,
      lucideReceiptText,
      lucideTag,
      lucideTrendingUp,
      lucideTrophy,
      lucideUsers,
      lucideWallet,
    }),
  ],
  templateUrl: './reporte-kpi-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteKpiGridComponent {
  readonly kpis = input.required<ReporteKpi[]>();

  valorClase(tono: ReporteKpiTono | undefined): string {
    if (tono === 'accent') return 'text-primary';
    if (tono === 'positive') return 'text-emerald-600';
    if (tono === 'warning') return 'text-amber-600';
    return '';
  }
}
