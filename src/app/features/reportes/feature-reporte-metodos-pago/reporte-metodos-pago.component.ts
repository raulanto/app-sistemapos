import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { provideIcons } from '@ng-icons/core';
import { lucideWallet } from '@ng-icons/lucide';

import { ZardChartImports } from '@/shared/components/chart/chart.imports';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { fmtCurrency, fmtPct } from '../data-access/reporte-format.util';
import { ReporteFiltrosService } from '../data-access/reporte-filtros.service';
import { ReporteService } from '../data-access/reporte.service';
import { VentasPorMetodoPagoReporte } from '../data-access/reporte.models';
import { ReporteFiltrosComponent } from '../ui/reporte-filtros/reporte-filtros.component';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

const ETIQUETAS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  tarjeta_credito: 'Tarjeta de crédito',
  tarjeta_debito: 'Tarjeta de débito',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  monedero: 'Monedero',
};

@Component({
  selector: 'app-reporte-metodos-pago',
  standalone: true,
  imports: [
    CurrencyPipe,
    ...ZardChartImports,
    ...ZardTableImports,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ReporteFiltrosComponent,
    ReporteKpiGridComponent,
    ReporteExportarComponent,
  ],
  viewProviders: [provideIcons({ lucideWallet })],
  templateUrl: './reporte-metodos-pago.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteMetodosPagoComponent {
  readonly filtros = inject(ReporteFiltrosService);
  private readonly reporteService = inject(ReporteService);

  readonly cargando = signal(true);
  readonly reporte = signal<VentasPorMetodoPagoReporte | null>(null);

  constructor() {
    effect(() => {
      this.filtros.desde();
      this.filtros.hasta();
      this.filtros.sucursalId();
      this.cargar();
    });
  }

  cargar() {
    this.cargando.set(true);
    this.reporteService
      .ventasPorMetodoPago(this.filtros.rango())
      .pipe(catchError(() => of(null)))
      .subscribe(r => {
        this.reporte.set(r);
        this.cargando.set(false);
      });
  }

  etiqueta(metodo: string): string {
    return ETIQUETAS[metodo] ?? metodo.replace('_', ' ');
  }

  readonly kpis = computed<ReporteKpi[]>(() => {
    const m = this.reporte();
    if (!m) return [];
    const total = Number(m.total_general) || 0;
    const efectivo = Number(m.total_efectivo) || 0;
    const pctEfectivo = total > 0 ? (efectivo / total) * 100 : 0;
    const activos = m.detalle.filter(d => Number(d.total) > 0);
    const principal = [...activos].sort((a, b) => Number(b.total) - Number(a.total))[0];
    const pctPrincipal = principal && total > 0 ? (Number(principal.total) / total) * 100 : 0;

    return [
      { label: 'Total general', value: fmtCurrency(total), icon: 'lucideDollarSign', tono: 'accent', destacado: true, caption: `${activos.length} método(s) con movimiento` },
      { label: 'Efectivo', value: fmtCurrency(efectivo), icon: 'lucideWallet', caption: `${fmtPct(pctEfectivo)} del total` },
      ...(principal
        ? ([
            {
              label: 'Método principal',
              value: this.etiqueta(principal.metodo_pago),
              icon: 'lucideCreditCard',
              tono: 'positive' as const,
              caption: `${fmtPct(pctPrincipal)} del total · ${fmtCurrency(principal.total)}`,
            },
          ] satisfies ReporteKpi[])
        : []),
    ];
  });

  readonly metodoPagoData = computed(() =>
    (this.reporte()?.detalle ?? [])
      .map(d => ({ metodo_pago: this.etiqueta(d.metodo_pago), total: Number(d.total) }))
      .filter(d => d.total > 0),
  );
  readonly metodoPagoSeries = [{ dataKey: 'total' }];
}
