import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

interface ReporteNavItem {
  path: string;
  label: string;
}

@Component({
  selector: 'app-reportes-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './reportes-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesShellComponent {
  private readonly authService = inject(AuthService);

  readonly canProgramar = computed(() => this.authService.hasPermission(...PERMISOS.reportes.programar));

  readonly nav: ReporteNavItem[] = [
    { path: 'dashboard', label: 'Dashboard' },
    { path: 'ventas', label: 'Ventas' },
    { path: 'metodos-pago', label: 'Métodos de pago' },
    { path: 'vendedores', label: 'Por vendedor' },
    { path: 'productos', label: 'Productos más vendidos' },
    { path: 'inventario', label: 'Inventario valorizado' },
    { path: 'mermas', label: 'Mermas y ajustes' },
    { path: 'clientes', label: 'Clientes con saldo' },
    { path: 'corte-caja', label: 'Corte de caja' },
  ];
}
