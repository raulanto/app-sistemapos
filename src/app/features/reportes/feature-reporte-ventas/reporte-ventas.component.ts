import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { provideIcons } from '@ng-icons/core';
import { lucideBarChart3, lucideLineChart, lucideReceiptText, lucideShoppingBag, lucideTrendingUp } from '@ng-icons/lucide';
import { ZardChartImports } from '@/shared/components/chart/chart.imports';
import { ZardChartOptionOverride } from '@/shared/components/chart/chart.types';
import { ZardTabsImports } from '@/shared/components/tabs/tabs.imports';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { fmtCurrency, fmtNum, fmtPct } from '../data-access/reporte-format.util';
import { ReporteFiltrosService } from '../data-access/reporte-filtros.service';
import { ReporteService } from '../data-access/reporte.service';
import { ProductoMasVendidoItem, VentasReporte } from '../data-access/reporte.models';
import { ReporteFiltrosComponent } from '../ui/reporte-filtros/reporte-filtros.component';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [
    RouterLink,
    ...ZardChartImports,
    ...ZardTabsImports,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ReporteFiltrosComponent,
    ReporteKpiGridComponent,
    ReporteExportarComponent,
  ],
  viewProviders: [provideIcons({ lucideReceiptText, lucideLineChart, lucideBarChart3, lucideTrendingUp, lucideShoppingBag })],
  templateUrl: './reporte-ventas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteVentasComponent {
  readonly filtros = inject(ReporteFiltrosService);
  private readonly reporteService = inject(ReporteService);

  readonly cargando = signal(true);
  readonly reporte = signal<VentasReporte | null>(null);
  readonly activeTab = signal<'ventas' | 'top'>('ventas');
  readonly chartType = signal<'area' | 'bar'>('area');
  readonly topProductos = signal<ProductoMasVendidoItem[]>([]);

  onTabChange(event: { index: number }) {
    this.activeTab.set(event.index === 0 ? 'ventas' : 'top');
  }

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
    const query = this.filtros.rango();

    forkJoin({
      ventas: this.reporteService.ventas(query).pipe(catchError(() => of(null))),
      top: this.reporteService.productosMasVendidos({ ...query, page_size: 5 }).pipe(catchError(() => of(null))),
    }).subscribe(({ ventas, top }) => {
      this.reporte.set(ventas);
      this.topProductos.set(top?.data ?? []);
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

  readonly ventasPorDiaData = computed(() =>
    (this.reporte()?.por_dia ?? []).map(d => ({
      dia: d.dia.slice(5),
      ventasCount: d.numero_ventas,
      totalMonto: Number(d.total),
    }))
  );

  readonly ventasPorDiaSeries = [
    { dataKey: 'ventasCount', type: 'bar' as const, yAxisIndex: 1 },
    { dataKey: 'totalMonto', type: 'area' as const, yAxisIndex: 0 },
  ];

  readonly ventasPorDiaConfig = {
    ventasCount: { label: 'Nº de Ventas', color: '#8b5cf6' }, // Vívido Violeta / Indigo
    totalMonto: { label: 'Monto Total ($)', color: '#10b981' }, // Vívido Verde Esmeralda
  };

  readonly ventasPorDiaOption: ZardChartOptionOverride = {
    yAxis: [
      {
        type: 'value',
        name: 'Monto ($)',
        splitLine: { show: true, lineStyle: { opacity: 0.15 } },
        axisLabel: { formatter: '${value}' },
      },
      {
        type: 'value',
        name: 'Nº Ventas',
        splitLine: { show: false },
        axisLabel: { formatter: '{value}' },
      },
    ],
  };

  readonly topProductosData = computed(() =>
    this.topProductos().map(p => ({
      nombre: p.nombre,
      unidades: Number(p.cantidad_vendida),
      total: Number(p.monto_total),
    }))
  );
  readonly topProductosSeries = [{ dataKey: 'unidades' }];
  readonly topProductosConfig = { unidades: { label: 'Unidades vendidas', color: '#06b6d4' } }; // Vívido Cyan
}

