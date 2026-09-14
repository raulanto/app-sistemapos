import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { provideIcons } from '@ng-icons/core';
import { lucideBoxes } from '@ng-icons/lucide';

import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { fmtCurrency, fmtNum } from '../data-access/reporte-format.util';
import { ReporteFiltrosService } from '../data-access/reporte-filtros.service';
import { ReporteService } from '../data-access/reporte.service';
import { ProductoMasVendidoItem } from '../data-access/reporte.models';
import { ReporteFiltrosComponent } from '../ui/reporte-filtros/reporte-filtros.component';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReportePaginacionComponent } from '../ui/reporte-paginacion/reporte-paginacion.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

@Component({
  selector: 'app-reporte-productos',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ...ZardTableImports,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ReporteFiltrosComponent,
    ReporteKpiGridComponent,
    ReportePaginacionComponent,
    ReporteExportarComponent,
  ],
  viewProviders: [provideIcons({ lucideBoxes })],
  templateUrl: './reporte-productos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteProductosComponent {
  readonly filtros = inject(ReporteFiltrosService);
  private readonly reporteService = inject(ReporteService);

  readonly data = signal<ProductoMasVendidoItem[]>([]);
  readonly cargando = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

  constructor() {
    effect(() => {
      this.filtros.desde();
      this.filtros.hasta();
      this.filtros.sucursalId();
      this.page.set(1);
      this.cargar();
    });
  }

  cargar() {
    this.cargando.set(true);
    this.reporteService
      .productosMasVendidos({ ...this.filtros.rango(), page: this.page(), page_size: this.pageSize() })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.cargando.set(false);
        if (!res) return;
        this.data.set(res.data);
        const p = res.meta?.pagination;
        this.totalItems.set(p?.total_items ?? res.data.length);
        this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
      });
  }

  onPage(p: number) {
    this.page.set(p);
    this.cargar();
  }
  onPageSize(n: number) {
    this.pageSize.set(n);
    this.page.set(1);
    this.cargar();
  }

  esTop(i: number): boolean {
    return this.page() === 1 && i === 0;
  }

  readonly kpis = computed<ReporteKpi[]>(() => {
    const items = this.data();
    if (!items.length) return [];
    const unidades = items.reduce((s, p) => s + (Number(p.cantidad_vendida) || 0), 0);
    const monto = items.reduce((s, p) => s + (Number(p.monto_total) || 0), 0);
    const top = this.page() === 1 ? items[0] : null;

    return [
      { label: 'Productos distintos', value: fmtNum(this.totalItems()), icon: 'lucideBoxes' },
      ...(top
        ? ([{ label: 'Top producto', value: top.nombre, icon: 'lucideTrophy', tono: 'positive' as const, destacado: true, caption: `${fmtNum(top.cantidad_vendida, 4)} unid. · ${fmtCurrency(top.monto_total)}` }] satisfies ReporteKpi[])
        : []),
      { label: 'Unidades vendidas (página)', value: fmtNum(unidades, 4), icon: 'lucideTag' },
      { label: 'Monto total (página)', value: fmtCurrency(monto), icon: 'lucideDollarSign' },
    ];
  });
}
