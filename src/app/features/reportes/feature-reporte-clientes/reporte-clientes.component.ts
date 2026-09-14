import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { provideIcons } from '@ng-icons/core';
import { lucideWallet } from '@ng-icons/lucide';

import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { fmtCurrency, fmtNum } from '../data-access/reporte-format.util';
import { ReporteFiltrosService } from '../data-access/reporte-filtros.service';
import { ReporteService } from '../data-access/reporte.service';
import { ClienteConSaldoItem } from '../data-access/reporte.models';
import { ReporteFiltrosComponent } from '../ui/reporte-filtros/reporte-filtros.component';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReportePaginacionComponent } from '../ui/reporte-paginacion/reporte-paginacion.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

@Component({
  selector: 'app-reporte-clientes',
  standalone: true,
  imports: [
    CurrencyPipe,
    ...ZardTableImports,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ReporteFiltrosComponent,
    ReporteKpiGridComponent,
    ReporteExportarComponent,
    ReportePaginacionComponent,
  ],
  viewProviders: [provideIcons({ lucideWallet })],
  templateUrl: './reporte-clientes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteClientesComponent {
  readonly filtros = inject(ReporteFiltrosService);
  private readonly reporteService = inject(ReporteService);

  readonly data = signal<ClienteConSaldoItem[]>([]);
  readonly cargando = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

  constructor() {
    effect(() => {
      this.filtros.sucursalId();
      this.page.set(1);
      this.cargar();
    });
  }

  cargar() {
    this.cargando.set(true);
    this.reporteService
      .clientesConSaldo({ sucursal_id: this.filtros.sucursalParaQuery(), page: this.page(), page_size: this.pageSize() })
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

  disponible(c: ClienteConSaldoItem): number {
    return Number(c.limite_credito) - Number(c.saldo_credito);
  }

  readonly kpis = computed<ReporteKpi[]>(() => {
    const items = this.data();
    if (!items.length) return [];
    const saldo = items.reduce((s, c) => s + (Number(c.saldo_credito) || 0), 0);
    const limite = items.reduce((s, c) => s + (Number(c.limite_credito) || 0), 0);

    return [
      { label: 'Clientes con saldo', value: fmtNum(this.totalItems()), icon: 'lucideUsers' },
      { label: 'Saldo pendiente (página)', value: fmtCurrency(saldo), icon: 'lucideWallet', tono: 'warning' },
      { label: 'Límite total (página)', value: fmtCurrency(limite), icon: 'lucideCreditCard' },
      { label: 'Disponible (página)', value: fmtCurrency(limite - saldo), icon: 'lucideDollarSign', tono: 'positive' },
    ];
  });
}
