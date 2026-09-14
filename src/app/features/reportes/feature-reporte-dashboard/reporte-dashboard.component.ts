import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { provideIcons } from '@ng-icons/core';
import { lucideBoxes, lucideLandmark } from '@ng-icons/lucide';

import { AuthService } from '@/core/auth/api/auth.service';
import { SucursalService } from '@/core/sucursal/sucursal.service';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSelectImports } from '@/shared/components/select/select.imports';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { fmtCurrency, fmtNum, fmtPct } from '../data-access/reporte-format.util';
import { ReporteService } from '../data-access/reporte.service';
import { DashboardReporte } from '../data-access/reporte.models';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';

@Component({
  selector: 'app-reporte-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    FormsModule,
    ...ZardSelectImports,
    ...ZardTableImports,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ReporteKpiGridComponent,
  ],
  viewProviders: [provideIcons({ lucideBoxes, lucideLandmark })],
  templateUrl: './reporte-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteDashboardComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly authService = inject(AuthService);
  readonly sucursalService = inject(SucursalService);

  readonly esGlobal = computed(() => {
    const codigo = this.authService.currentUser()?.rol?.codigo;
    return codigo === 'admin' || codigo === 'gerente';
  });

  readonly sucursalId = signal('');
  readonly cargando = signal(true);
  readonly reporte = signal<DashboardReporte | null>(null);

  constructor() {
    effect(() => {
      this.sucursalId();
      this.cargar();
    });
  }

  cargar() {
    this.cargando.set(true);
    this.reporteService
      .dashboard(this.esGlobal() ? this.sucursalId() || undefined : undefined)
      .pipe(catchError(() => of(null)))
      .subscribe(r => {
        this.reporte.set(r);
        this.cargando.set(false);
      });
  }

  setSucursal(v: string) {
    this.sucursalId.set(v);
  }

  private variacion(hoy: number, ayer: number): number | null {
    if (!ayer) return null;
    return ((hoy - ayer) / ayer) * 100;
  }

  readonly kpis = computed<ReporteKpi[]>(() => {
    const r = this.reporte();
    if (!r) return [];
    const hoy = Number(r.ventas_hoy.total_vendido) || 0;
    const ayer = Number(r.ventas_ayer.total_vendido) || 0;
    const variacion = this.variacion(hoy, ayer);
    const tendencia = variacion == null ? 'Sin ventas ayer a esta hora' : `${variacion >= 0 ? '+' : ''}${fmtPct(variacion)} vs. ayer`;

    return [
      {
        label: 'Ventas hoy',
        value: fmtCurrency(hoy),
        icon: 'lucideDollarSign',
        tono: variacion == null ? 'default' : variacion >= 0 ? 'positive' : 'warning',
        destacado: true,
        caption: `${fmtNum(r.ventas_hoy.numero_ventas)} venta(s) · ${tendencia}`,
      },
      { label: 'Ventas ayer (misma hora)', value: fmtCurrency(ayer), icon: 'lucideCalendarDays', caption: `${fmtNum(r.ventas_ayer.numero_ventas)} venta(s)` },
      { label: 'Productos bajo stock', value: fmtNum(r.productos_bajo_stock), icon: 'lucideAlertTriangle', tono: r.productos_bajo_stock > 0 ? 'warning' : 'positive' },
      { label: 'Cajas abiertas', value: fmtNum(r.cajas_abiertas.length), icon: 'lucideLandmark' },
    ];
  });
}
