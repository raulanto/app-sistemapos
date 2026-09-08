import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBan, lucideReceiptText, lucideRefreshCw, lucideX } from '@ng-icons/lucide';

import { VentaService } from '../data-access/venta.service';
import { VentaListItem, EstadoVenta } from '../data-access/ventas.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

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
    ...ZardPaginationImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardInputComponent,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideBan, lucideReceiptText, lucideRefreshCw, lucideX })],
  templateUrl: './ventas-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentasListComponent {
  private ventaService = inject(VentaService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canAnular = computed(() => this.authService.hasPermission(...PERMISOS.ventas.anular));

  readonly ventas = signal<VentaListItem[]>([]);
  readonly loading = signal(true);

  readonly estado = signal<EstadoVenta | ''>('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly telefono = signal('');
  readonly hayFiltros = computed(
    () => !!this.estado() || !!this.desde() || !!this.hasta() || !!this.telefono().trim(),
  );

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

  /** Ventana de páginas visibles (máx. 5) alrededor de la actual. */
  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const w: number[] = [];
    for (let i = start; i <= end; i++) w.push(i);
    return w;
  });

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.ventaService
      .listar({
        estado: this.estado() || undefined,
        telefono: this.telefono().trim() || undefined,
        // `desde`/`hasta` son date-time: se cubre el día completo.
        desde: this.desde() ? `${this.desde()}T00:00:00` : undefined,
        hasta: this.hasta() ? `${this.hasta()}T23:59:59` : undefined,
        page: this.page(),
        page_size: this.pageSize(),
        sort: 'created_at:desc',
        include: 'cliente,usuario',
      })
      .subscribe({
        next: res => {
          this.ventas.set(res.data);
          const p = res.meta?.pagination;
          this.totalItems.set(p?.total_items ?? res.data.length);
          this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
          if (p?.page && p.page !== this.page()) this.page.set(p.page);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar ventas', err);
          this.loading.set(false);
        },
      });
  }

  /** Todo cambio de filtro o de tamaño de página vuelve a la primera página. */
  private recargarDesdeInicio() {
    this.page.set(1);
    this.cargar();
  }

  setEstado(v: string) {
    this.estado.set(v as EstadoVenta | '');
    this.recargarDesdeInicio();
  }
  setDesde(v: string) {
    this.desde.set(v);
    this.recargarDesdeInicio();
  }
  setHasta(v: string) {
    this.hasta.set(v);
    this.recargarDesdeInicio();
  }
  setTelefono(v: string) {
    this.telefono.set(v);
    this.recargarDesdeInicio();
  }
  limpiarFiltros() {
    this.estado.set('');
    this.desde.set('');
    this.hasta.set('');
    this.telefono.set('');
    this.recargarDesdeInicio();
  }

  setPageSize(v: string) {
    this.pageSize.set(Number(v) || 20);
    this.recargarDesdeInicio();
  }
  irAPagina(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.cargar();
  }
  prev() {
    this.irAPagina(this.page() - 1);
  }
  next() {
    this.irAPagina(this.page() + 1);
  }

  badge(estado: EstadoVenta): 'default' | 'secondary' | 'destructive' {
    if (estado === 'pagada') return 'default';
    if (estado === 'cancelada') return 'destructive';
    return 'secondary';
  }

  anular(venta: VentaListItem) {
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
