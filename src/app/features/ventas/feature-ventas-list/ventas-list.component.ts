import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBan, lucideReceiptText, lucideRefreshCw, lucideX, lucideCalendar, lucideReceipt, lucideDollarSign, lucideAlertCircle, lucideCheckCircle2 } from '@ng-icons/lucide';

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
import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardPopoverImports } from '../../../shared/components/popover/popover.imports';
import { ZardCalendarComponent } from '../../../shared/components/calendar/calendar.component';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { AnularVentaSheetComponent } from '../ui/anular-venta-sheet/anular-venta-sheet.component';

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
    ...ZardCardImports,
    ...ZardPopoverImports,
    ...ZardPaginationImports,
    ZardCalendarComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardInputComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideBan,
      lucideReceiptText,
      lucideRefreshCw,
      lucideX,
      lucideCalendar,
      lucideReceipt,
      lucideDollarSign,
      lucideAlertCircle,
      lucideCheckCircle2,
    }),
  ],
  templateUrl: './ventas-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentasListComponent {
  private ventaService = inject(VentaService);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);
  private authService = inject(AuthService);

  readonly canAnular = computed(() => this.authService.hasPermission(...PERMISOS.ventas.anular));

  readonly ventas = signal<VentaListItem[]>([]);
  readonly loading = signal(true);

  readonly estado = signal<EstadoVenta | ''>('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly telefono = signal('');

  readonly dateRange = signal<Date[] | null>(null);

  readonly rangoTexto = computed(() => {
    const range = this.dateRange();
    if (!range || range.length === 0) return 'Filtrar por fechas';
    const dp = new DatePipe('en-US');
    const startStr = dp.transform(range[0], 'dd/MM/yyyy');
    if (range.length === 1) return startStr;
    const endStr = dp.transform(range[1], 'dd/MM/yyyy');
    return `${startStr} - ${endStr}`;
  });

  // KPIs calculados del listado actual
  readonly totalVentasMonto = computed(() =>
    this.ventas().reduce((acc, v) => acc + (Number(v.total) || 0), 0),
  );
  readonly pagadasCount = computed(() =>
    this.ventas().filter((v) => v.estado === 'pagada').length,
  );
  readonly pendientesCount = computed(() =>
    this.ventas().filter((v) => v.estado === 'pendiente_pago' || Number(v.saldo_pendiente) > 0).length,
  );

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

  onDateRangeChange(val: any) {
    if (Array.isArray(val) && val.length > 0) {
      this.dateRange.set(val);
      const dp = new DatePipe('en-US');
      const start = val[0] ? (dp.transform(val[0], 'yyyy-MM-dd') ?? '') : '';
      const end = val.length > 1 && val[1] ? (dp.transform(val[1], 'yyyy-MM-dd') ?? start) : start;
      this.desde.set(start);
      this.hasta.set(end);
      this.recargarDesdeInicio();
    } else {
      this.limpiarFechas();
    }
  }

  limpiarFechas() {
    this.dateRange.set(null);
    this.desde.set('');
    this.hasta.set('');
    this.recargarDesdeInicio();
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
    this.dateRange.set(null);
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
    this.sheetService.create({
      zTitle: 'Anular venta',
      zDescription: `Folio ${venta.id.slice(0, 8)}`,
      zContent: AnularVentaSheetComponent,
      zData: { ventaId: venta.id, folio: venta.id.slice(0, 8) },
      zOkText: 'Anular venta',
      zCancelText: 'Volver',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Venta anulada');
              this.cargar();
              resolve();
            },
            error: (err: any) => {
              this.sonner.error(err?.error?.error?.message ?? 'No se pudo anular la venta');
              reject(err);
            },
          });
        });
      },
    });
  }
}
