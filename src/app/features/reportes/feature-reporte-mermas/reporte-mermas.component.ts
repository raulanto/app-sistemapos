import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle } from '@ng-icons/lucide';

import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { fmtCurrency, fmtNum, fmtPct } from '../data-access/reporte-format.util';
import { ReporteFiltrosService } from '../data-access/reporte-filtros.service';
import { ReporteService } from '../data-access/reporte.service';
import { MermasAjustesReporte } from '../data-access/reporte.models';
import { ReporteFiltrosComponent } from '../ui/reporte-filtros/reporte-filtros.component';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

@Component({
  selector: 'app-reporte-mermas',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ...ZardTableImports,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ReporteFiltrosComponent,
    ReporteKpiGridComponent,
    ReporteExportarComponent,
  ],
  viewProviders: [provideIcons({ lucideAlertTriangle })],
  templateUrl: './reporte-mermas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteMermasComponent {
  readonly filtros = inject(ReporteFiltrosService);
  private readonly reporteService = inject(ReporteService);

  readonly cargando = signal(true);
  readonly reporte = signal<MermasAjustesReporte | null>(null);

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
      .mermasAjustes(this.filtros.rango())
      .pipe(catchError(() => of(null)))
      .subscribe(r => {
        this.reporte.set(r);
        this.cargando.set(false);
      });
  }

  readonly kpis = computed<ReporteKpi[]>(() => {
    const m = this.reporte();
    if (!m) return [];
    const merma = Number(m.total_merma) || 0;
    const ajuste = Number(m.total_ajuste) || 0;
    const pctMerma = merma + ajuste > 0 ? (merma / (merma + ajuste)) * 100 : 0;
    const movimientos = m.detalle.reduce((s, d) => s + d.numero_movimientos, 0);

    return [
      { label: 'Valor estimado', value: fmtCurrency(m.valor_estimado_total), icon: 'lucideDollarSign', tono: 'warning', destacado: true, caption: `${fmtNum(movimientos)} movimiento(s) en el rango` },
      { label: 'Merma total', value: fmtNum(merma, 4), icon: 'lucideAlertTriangle', caption: `${fmtPct(pctMerma)} del total merma+ajuste` },
      { label: 'Ajuste total', value: fmtNum(ajuste, 4), icon: 'lucideTag' },
    ];
  });
}
