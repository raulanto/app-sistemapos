import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBan, lucideLandmark, lucideSearch } from '@ng-icons/lucide';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardInputComponent } from '@/shared/components/input/input.component';

import { fmtCurrency } from '../data-access/reporte-format.util';
import { ReporteService } from '../data-access/reporte.service';
import { CorteCajaReporte } from '../data-access/reporte.models';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

interface DetalleLinea {
  label: string;
  value: string;
}

@Component({
  selector: 'app-reporte-corte-caja',
  standalone: true,
  imports: [FormsModule, NgIcon, ZardButtonComponent, ZardInputComponent, ZardEmptyComponent, ReporteKpiGridComponent, ReporteExportarComponent],
  viewProviders: [provideIcons({ lucideBan, lucideLandmark, lucideSearch })],
  templateUrl: './reporte-corte-caja.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteCorteCajaComponent {
  private readonly reporteService = inject(ReporteService);

  readonly turnoIdInput = signal('');
  readonly corte = signal<CorteCajaReporte | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  buscar() {
    const id = this.turnoIdInput().trim();
    if (!id) return;
    this.cargando.set(true);
    this.error.set(null);
    this.corte.set(null);
    this.reporteService.corteCaja(id).subscribe({
      next: r => {
        this.corte.set(r);
        this.cargando.set(false);
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.cargando.set(false);
        this.error.set(err?.error?.error?.message ?? 'No se encontró ese turno de caja.');
      },
    });
  }

  readonly kpis = computed<ReporteKpi[]>(() => {
    const c = this.corte();
    if (!c) return [];
    return [
      { label: 'Monto final esperado', value: fmtCurrency(c.monto_final_esperado), icon: 'lucideLandmark', tono: 'accent', destacado: true, caption: `Monto inicial ${fmtCurrency(c.monto_inicial)}` },
      { label: 'Efectivo', value: fmtCurrency(c.total_efectivo), icon: 'lucideWallet' },
      { label: 'Tarjeta', value: fmtCurrency(c.total_tarjeta), icon: 'lucideCreditCard' },
      { label: 'Transferencia', value: fmtCurrency(c.total_transferencia), icon: 'lucideDollarSign' },
      { label: 'Crédito', value: fmtCurrency(c.total_credito), icon: 'lucideReceiptText' },
      { label: 'Monedero', value: fmtCurrency(c.total_monedero), icon: 'lucideWallet' },
    ];
  });

  readonly detalle = computed<DetalleLinea[]>(() => {
    const c = this.corte();
    if (!c) return [];
    return [
      { label: 'Descuento por promociones', value: fmtCurrency(c.total_descuento_promo) },
      { label: 'Devoluciones en efectivo', value: fmtCurrency(c.total_devoluciones_efectivo) },
      { label: 'Ingresos de caja', value: fmtCurrency(c.total_ingresos) },
      { label: 'Retiros de caja', value: fmtCurrency(c.total_retiros) },
      { label: 'Gastos', value: fmtCurrency(c.total_gastos) },
    ];
  });
}
