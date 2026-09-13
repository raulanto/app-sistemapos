import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideRefreshCw, lucideShuffle, lucideX } from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import {
  ESTADOS_PEDIDO_PROVEEDOR,
  EstadoPedidoProveedor,
  mensajeProveedorError,
  PedidoProveedorResponse,
} from '../data-access/proveedores.models';
import { SucursalService } from '../../../core/sucursal/sucursal.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { PedidoProveedorFormSheetComponent } from '../ui/pedido-proveedor-form-sheet/pedido-proveedor-form-sheet.component';

@Component({
  selector: 'app-pedido-proveedor-list',
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
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideRefreshCw, lucideShuffle, lucideX })],
  templateUrl: './pedido-proveedor-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoProveedorListComponent {
  private route = inject(ActivatedRoute);
  private proveedorService = inject(ProveedorService);
  public sucursalService = inject(SucursalService);
  private authService = inject(AuthService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);

  readonly canGestionar = computed(() => this.authService.hasPermission(...PERMISOS.pedidoProveedor.gestionar));
  readonly canGenerarReorden = computed(() => this.authService.hasPermission(...PERMISOS.pedidoProveedor.generarManual));

  readonly estados = ESTADOS_PEDIDO_PROVEEDOR;

  readonly pedidos = signal<PedidoProveedorResponse[]>([]);
  readonly loading = signal(true);
  readonly evaluando = signal(false);

  readonly proveedorId = signal<string | null>(this.route.snapshot.queryParamMap.get('proveedor_id'));
  readonly estado = signal<EstadoPedidoProveedor | ''>('');
  readonly sucursalId = signal<string>('');

  readonly hayFiltros = computed(() => !!this.proveedorId() || !!this.estado() || !!this.sucursalId());

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

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
    this.proveedorService
      .listarPedidos({
        proveedor_id: this.proveedorId() || undefined,
        sucursal_id: this.sucursalId() || undefined,
        estado: this.estado() || undefined,
        page: this.page(),
        page_size: this.pageSize(),
        sort: 'fecha_pedido:desc',
      })
      .subscribe({
        next: res => {
          this.pedidos.set(res.data);
          const p = res.meta?.pagination;
          this.totalItems.set(p?.total_items ?? res.data.length);
          this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
          if (p?.page && p.page !== this.page()) this.page.set(p.page);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar pedidos a proveedor', err);
          this.loading.set(false);
        },
      });
  }

  private recargarDesdeInicio() {
    this.page.set(1);
    this.cargar();
  }

  setEstado(v: string) {
    this.estado.set(v as EstadoPedidoProveedor | '');
    this.recargarDesdeInicio();
  }
  setSucursal(v: string) {
    this.sucursalId.set(v);
    this.recargarDesdeInicio();
  }
  limpiarFiltros() {
    this.proveedorId.set(null);
    this.estado.set('');
    this.sucursalId.set('');
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

  nuevo() {
    this.sheetService.create({
      zTitle: 'Nuevo pedido a proveedor',
      zDescription: 'Arma un pedido manual, fuera del motor de reorden.',
      zContent: PedidoProveedorFormSheetComponent,
      zSize: 'lg',
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Pedido creado en borrador');
              this.cargar();
              resolve();
            },
            error: (err: unknown) => {
              this.sonner.error(mensajeProveedorError(err, 'No se pudo crear el pedido'));
              reject(err);
            },
          });
        });
      },
    });
  }

  /** Compara stock vs `stock_minimo` de cada vínculo principal y arma/actualiza pedidos en borrador. Nunca envía nada solo. */
  evaluarReorden() {
    const sucursalId = this.sucursalService.selectedSucursalId();
    if (!sucursalId) {
      this.sonner.error('Selecciona una sucursal activa primero.');
      return;
    }
    this.evaluando.set(true);
    this.proveedorService.evaluarReorden(sucursalId).subscribe({
      next: resultados => {
        this.evaluando.set(false);
        if (resultados.length === 0) {
          this.sonner.info('Todo por encima del stock mínimo: no se generó ningún pedido.');
        } else {
          const nuevos = resultados.filter(r => r.fue_creado).length;
          const actualizados = resultados.length - nuevos;
          this.sonner.success(
            `Reorden evaluado: ${nuevos} pedido(s) nuevo(s), ${actualizados} actualizado(s).`,
          );
        }
        this.cargar();
      },
      error: err => {
        this.evaluando.set(false);
        this.sonner.error(mensajeProveedorError(err, 'No se pudo evaluar el reorden'));
      },
    });
  }

  labelEstado(e: string) {
    return this.estados.find(x => x.value === e)?.label ?? e;
  }
  estadoBadge(e: EstadoPedidoProveedor): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'recibido') return 'default';
    if (e === 'cancelado') return 'destructive';
    if (e === 'parcial' || e === 'enviado') return 'secondary';
    return 'outline';
  }
}
