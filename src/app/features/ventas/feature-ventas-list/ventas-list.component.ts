import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBan, lucideReceiptText } from '@ng-icons/lucide';

import { VentaService } from '../data-access/venta.service';
import { VentaResponse, EstadoVenta } from '../data-access/ventas.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    NgIconComponent,
    ...ZardTableImports,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideBan, lucideReceiptText })],
  templateUrl: './ventas-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentasListComponent {
  private ventaService = inject(VentaService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);
  private authService = inject(AuthService);

  readonly canAnular = computed(() => this.authService.hasPermission(...PERMISOS.ventas.anular));

  readonly ventas = signal<VentaResponse[]>([]);
  readonly loading = signal(true);
  readonly estado = signal<EstadoVenta | ''>('');

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.ventaService
      .listar({
        estado: this.estado() || undefined,
        page_size: 50,
        sort: 'created_at:desc',
        include: 'cliente,usuario',
      })
      .subscribe({
        next: res => {
          this.ventas.set(res.data);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar ventas', err);
          this.loading.set(false);
        },
      });
  }

  setEstado(v: string) {
    this.estado.set(v as EstadoVenta | '');
    this.cargar();
  }

  badge(estado: EstadoVenta): 'default' | 'secondary' | 'destructive' {
    if (estado === 'pagada') return 'default';
    if (estado === 'cancelada') return 'destructive';
    return 'secondary';
  }

  anular(venta: VentaResponse) {
    // Motivo opcional; cancelar el prompt aborta la anulación.
    const motivo = window.prompt(
      'Anular esta venta repone el stock y revierte el crédito (queda como "cancelada").\nMotivo (opcional):',
    );
    if (motivo === null) return;
    this.ventaService.anular(venta.id, { motivo: motivo || null }).subscribe({
      next: () => {
        this.sonner.success('Venta anulada');
        this.cargar();
      },
      error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo anular la venta'),
    });
  }
}
