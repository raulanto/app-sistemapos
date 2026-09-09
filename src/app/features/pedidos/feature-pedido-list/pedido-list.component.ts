import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideRefreshCw, lucideX, lucideClipboardList, lucideReceiptText, lucideTruck } from '@ng-icons/lucide';

import { PedidoService } from '../data-access/pedido.service';
import {
  CANALES_PEDIDO,
  CanalPedido,
  ESTADOS_ENTREGA,
  ESTADOS_PEDIDO,
  EstadoEntrega,
  EstadoPedido,
  PedidoListItem,
  PedidoResumen,
  TIPOS_PEDIDO,
  TipoPedido,
} from '../data-access/pedidos.models';
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

@Component({
  selector: 'app-pedido-list',
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
  viewProviders: [provideIcons({ lucidePlus, lucideRefreshCw, lucideX, lucideClipboardList, lucideReceiptText, lucideTruck })],
  templateUrl: './pedido-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoListComponent {
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.pedidos.crear));

  readonly tipos = TIPOS_PEDIDO;
  readonly canales = CANALES_PEDIDO;
  readonly estados = ESTADOS_PEDIDO;
  readonly estadosEntrega = ESTADOS_ENTREGA;

  readonly pedidos = signal<PedidoListItem[]>([]);
  readonly resumen = signal<PedidoResumen | null>(null);
  readonly loading = signal(true);

  readonly estado = signal<EstadoPedido | ''>('');
  readonly tipo = signal<TipoPedido | ''>('');
  readonly estadoEntrega = signal<EstadoEntrega | ''>('');
  readonly canal = signal<CanalPedido | ''>('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly telefono = signal('');
  readonly sort = signal<'created_at:desc' | 'fecha_promesa:asc'>('created_at:desc');

  readonly hayFiltros = computed(
    () =>
      !!this.estado() ||
      !!this.tipo() ||
      !!this.estadoEntrega() ||
      !!this.canal() ||
      !!this.desde() ||
      !!this.hasta() ||
      !!this.telefono().trim(),
  );

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
    this.cargarResumen();
  }

  cargar() {
    this.loading.set(true);
    this.pedidoService
      .listar({
        estado: this.estado() || undefined,
        tipo: this.tipo() || undefined,
        estado_entrega: this.estadoEntrega() || undefined,
        canal: this.canal() || undefined,
        telefono: this.telefono().trim() || undefined,
        desde: this.desde() ? `${this.desde()}T00:00:00` : undefined,
        hasta: this.hasta() ? `${this.hasta()}T23:59:59` : undefined,
        page: this.page(),
        page_size: this.pageSize(),
        sort: this.sort(),
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
          console.error('Error al cargar pedidos', err);
          this.loading.set(false);
        },
      });
  }

  cargarResumen() {
    this.pedidoService.resumen().subscribe({
      next: r => this.resumen.set(r),
      error: () => this.resumen.set(null),
    });
  }

  private recargarDesdeInicio() {
    this.page.set(1);
    this.cargar();
  }

  setEstado(v: string) {
    this.estado.set(v as EstadoPedido | '');
    this.recargarDesdeInicio();
  }
  setTipo(v: string) {
    this.tipo.set(v as TipoPedido | '');
    this.recargarDesdeInicio();
  }
  setEstadoEntrega(v: string) {
    this.estadoEntrega.set(v as EstadoEntrega | '');
    this.recargarDesdeInicio();
  }
  setCanal(v: string) {
    this.canal.set(v as CanalPedido | '');
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
  setSort(v: string) {
    this.sort.set(v as 'created_at:desc' | 'fecha_promesa:asc');
    this.recargarDesdeInicio();
  }
  limpiarFiltros() {
    this.estado.set('');
    this.tipo.set('');
    this.estadoEntrega.set('');
    this.canal.set('');
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

  refrescar() {
    this.cargar();
    this.cargarResumen();
  }

  estadoBadge(e: EstadoPedido): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'facturado') return 'default';
    if (e === 'cancelado') return 'destructive';
    if (e === 'confirmado') return 'secondary';
    return 'outline';
  }
  entregaBadge(e: EstadoEntrega): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'entregado') return 'default';
    if (e === 'fallido') return 'destructive';
    if (e === 'en_reparto') return 'secondary';
    return 'outline';
  }
  labelEstado(e: string) {
    return this.estados.find(x => x.value === e)?.label ?? e;
  }
  labelEntrega(e: string) {
    return this.estadosEntrega.find(x => x.value === e)?.label ?? e;
  }
  labelTipo(t: string) {
    return this.tipos.find(x => x.value === t)?.label ?? t;
  }
}
