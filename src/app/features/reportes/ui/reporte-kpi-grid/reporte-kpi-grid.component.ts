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
  lucideTrendingDown,
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
      lucideTrendingDown,
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

  iconBadgeBg(tono: ReporteKpiTono | undefined): string {
    if (tono === 'accent') return 'bg-primary/10 text-primary';
    if (tono === 'positive') return 'bg-emerald-500/10 text-emerald-600';
    if (tono === 'warning') return 'bg-amber-500/10 text-amber-600';
    return 'bg-muted text-muted-foreground';
  }

  /**
   * Flex en vez de grid: la cantidad de KPIs varía por vista (y por datos, cuando alguno es
   * condicional), así que un grid de columnas fijas deja huecos en la última fila. Con
   * `flex-wrap` + `grow`, las tarjetas de la fila incompleta se estiran para llenar el ancho.
   */
  cardClasses(k: ReporteKpi): string {
    const base = 'grow basis-full gap-3 transition-shadow duration-200 hover:shadow-md';
    return k.destacado ? `${base} sm:basis-full lg:basis-[calc(50%-0.5rem)]` : `${base} sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]`;
  }
}
