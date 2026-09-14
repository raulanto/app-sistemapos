import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { provideIcons } from '@ng-icons/core';
import { lucideReceiptText } from '@ng-icons/lucide';

import { ZardChartImports } from '@/shared/components/chart/chart.imports';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

import { fmtCurrency, fmtNum, fmtPct } from '../data-access/reporte-format.util';
import { ReporteFiltrosService } from '../data-access/reporte-filtros.service';
import { ReporteService } from '../data-access/reporte.service';
import { VentasReporte } from '../data-access/reporte.models';
import { ReporteFiltrosComponent } from '../ui/reporte-filtros/reporte-filtros.component';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [...ZardChartImports, ZardEmptyComponent, ZardSkeletonComponent, ReporteFiltrosComponent, ReporteKpiGridComponent, ReporteExportarComponent],
  /** `z-empty` no auto-registra iconos: el que la usa debe darle el nombre vía viewProviders. */
  viewProviders: [provideIcons({ lucideReceiptText })],
  templateUrl: './reporte-ventas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteVentasComponent {
  readonly filtros = inject(ReporteFiltrosService);
  private readonly reporteService = inject(ReporteService);

  readonly cargando = signal(true);
  readonly reporte = signal<VentasReporte | null>(null);

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
      .ventas(this.filtros.rango())
      .pipe(catchError(() => of(null)))
      .subscribe(r => {
        this.reporte.set(r);
        this.cargando.set(false);
      });
  }

  private readonly mejorDia = computed(() => {
    const dias = this.reporte()?.por_dia ?? [];
    if (!dias.length) return null;
    return dias.reduce((mejor, d) => (Number(d.total) > Number(mejor.total) ? d : mejor), dias[0]);
  });

  readonly kpis = computed<ReporteKpi[]>(() => {
    const v = this.reporte();
    if (!v) return [];
    const totalVendido = Number(v.total_vendido) || 0;
    const descuento = Number(v.total_descuento_promo) || 0;
    const pctDescuento = totalVendido > 0 ? (descuento / totalVendido) * 100 : 0;
    const dias = v.por_dia.length || 1;
    const promedioDiario = totalVendido / dias;
    const mejorDia = this.mejorDia();

    return [
      { label: 'Total vendido', value: fmtCurrency(totalVendido), icon: 'lucideDollarSign', tono: 'accent', destacado: true, caption: `${fmtNum(v.numero_ventas)} venta(s) en el rango` },
      { label: 'Ticket promedio', value: fmtCurrency(v.ticket_promedio), icon: 'lucideReceiptText' },
      { label: 'Descuento por promo', value: fmtCurrency(descuento), icon: 'lucideTag', tono: descuento > 0 ? 'warning' : 'default', caption: `${fmtPct(pctDescuento)} del total vendido` },
      { label: 'Promedio diario', value: fmtCurrency(promedioDiario), icon: 'lucideCalendarDays', caption: `sobre ${dias} día(s) con ventas` },
      ...(mejorDia
        ? ([{ label: 'Mejor día', value: fmtCurrency(mejorDia.total), icon: 'lucideTrendingUp', tono: 'positive' as const, caption: `${mejorDia.dia} · ${fmtNum(mejorDia.numero_ventas)} venta(s)` }] satisfies ReporteKpi[])
        : []),
    ];
  });

  readonly ventasPorDiaData = computed(() => (this.reporte()?.por_dia ?? []).map(d => ({ dia: d.dia.slice(5), total: Number(d.total) })));
  readonly ventasPorDiaSeries = [{ dataKey: 'total' }];
  readonly ventasPorDiaConfig = { total: { label: 'Ventas', color: '#10b981' } };
}
