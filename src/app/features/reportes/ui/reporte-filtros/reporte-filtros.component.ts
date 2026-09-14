import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';

import { SucursalService } from '@/core/sucursal/sucursal.service';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardInputComponent } from '@/shared/components/input/input.component';
import { ZardSelectImports } from '@/shared/components/select/select.imports';

import { ReporteFiltrosService } from '../../data-access/reporte-filtros.service';

/** Barra de filtros compartida (fecha + sucursal) para las vistas de reportes que la necesitan. */
@Component({
  selector: 'app-reporte-filtros',
  standalone: true,
  imports: [FormsModule, NgIcon, ZardButtonComponent, ZardInputComponent, ...ZardSelectImports],
  viewProviders: [provideIcons({ lucideRefreshCw })],
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
}
