import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideRefreshCw, lucideX } from '@ng-icons/lucide';

import { SucursalService } from '@/core/sucursal/sucursal.service';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardInputComponent } from '@/shared/components/input/input.component';
import { ZardSelectImports } from '@/shared/components/select/select.imports';
import { ZardPopoverImports } from '@/shared/components/popover/popover.imports';
import { ZardCalendarComponent } from '@/shared/components/calendar/calendar.component';

import { ReporteFiltrosService } from '../../data-access/reporte-filtros.service';

/** Barra de filtros compartida (fecha + sucursal) para las vistas de reportes que la necesitan. */
@Component({
  selector: 'app-reporte-filtros',
  standalone: true,
  imports: [
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ...ZardSelectImports,
    ...ZardPopoverImports,
    ZardCalendarComponent,
  ],
  viewProviders: [provideIcons({ lucideCalendar, lucideRefreshCw, lucideX })],
  templateUrl: './reporte-filtros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteFiltrosComponent {
  readonly filtros = inject(ReporteFiltrosService);
  readonly sucursalService = inject(SucursalService);

  /** Algunos reportes (inventario, clientes con saldo) sólo usan sucursal, no rango de fechas. */
  readonly mostrarFechas = input(true);
  readonly cargando = input(false);
  readonly ayuda = input('');

  readonly recargar = output<void>();

  readonly dateRange = signal<Date[] | null>(null);

  readonly rangoTexto = computed(() => {
    const range = this.dateRange();
    if (!range || range.length === 0) {
      const d = this.filtros.desde();
      const h = this.filtros.hasta();
      if (!d && !h) return 'Filtrar por fechas';
      return `${d ? d.split('-').reverse().join('/') : ''} - ${h ? h.split('-').reverse().join('/') : ''}`;
    }
    const dp = new DatePipe('en-US');
    const startStr = dp.transform(range[0], 'dd/MM/yyyy');
    if (range.length === 1) return startStr;
    const endStr = dp.transform(range[1], 'dd/MM/yyyy');
    return `${startStr} - ${endStr}`;
  });

  onDateRangeChange(val: any) {
    if (Array.isArray(val) && val.length > 0) {
      this.dateRange.set(val);
      const dp = new DatePipe('en-US');
      const start = val[0] ? (dp.transform(val[0], 'yyyy-MM-dd') ?? '') : '';
      const end = val.length > 1 && val[1] ? (dp.transform(val[1], 'yyyy-MM-dd') ?? start) : start;
      this.filtros.setDesde(start);
      this.filtros.setHasta(end);
      this.recargar.emit();
    } else {
      this.limpiarFechas();
    }
  }

  limpiarFechas() {
    this.dateRange.set(null);
    this.filtros.setDesde('');
    this.filtros.setHasta('');
    this.recargar.emit();
  }
}
