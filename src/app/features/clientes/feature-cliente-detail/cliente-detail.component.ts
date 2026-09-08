import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePencil,
  lucideWallet,
  lucideCreditCard,
  lucideReceiptText,
  lucideMail,
  lucidePhone,
  lucideStore,
} from '@ng-icons/lucide';

import { ClienteService } from '../data-access/cliente.service';
import { ClienteResponse } from '../data-access/clientes.models';
import { VentaListItem, EstadoVenta } from '../../ventas/data-access/venta.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

import { ClienteFormSheetComponent } from '../ui/cliente-form-sheet/cliente-form-sheet.component';
import { ClienteCreditoSheetComponent } from '../ui/cliente-credito-sheet/cliente-credito-sheet.component';

@Component({
  selector: 'app-cliente-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ...ZardTableImports,
    ...ZardSelectImports,
    ...ZardPaginationImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucidePencil,
      lucideWallet,
      lucideCreditCard,
      lucideReceiptText,
      lucideMail,
      lucidePhone,
      lucideStore,
    }),
  ],
  templateUrl: './cliente-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteDetailComponent {
  private route = inject(ActivatedRoute);
  private clienteService = inject(ClienteService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.clientes.editar));
  readonly canCredito = computed(() => this.authService.hasPermission(...PERMISOS.clientes.credito));

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly cliente = signal<ClienteResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly ventas = signal<VentaListItem[]>([]);
  readonly ventasLoading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

  readonly disponible = computed(() => {
    const c = this.cliente();
    if (!c) return 0;
    return Math.max(0, (Number(c.limite_credito) || 0) - (Number(c.saldo_credito) || 0));
  });

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
    this.cargarCliente();
    this.cargarVentas();
  }

  private cargarCliente() {
    this.loading.set(true);
    this.error.set(false);
    this.clienteService.obtener(this.id, 'sucursal').subscribe({
      next: c => {
        this.cliente.set(c);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar el cliente', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private cargarVentas() {
    this.ventasLoading.set(true);
    this.clienteService
      .historialVentas(this.id, {
        page: this.page(),
        page_size: this.pageSize(),
        sort: 'created_at:desc',
        include: 'usuario,caja_turno',
      })
      .subscribe({
        next: res => {
          this.ventas.set(res.data);
          const p = res.meta?.pagination;
          this.totalItems.set(p?.total_items ?? res.data.length);
          this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
          if (p?.page && p.page !== this.page()) this.page.set(p.page);
          this.ventasLoading.set(false);
        },
        error: err => {
          console.error('Error al cargar el historial de compras', err);
          this.ventas.set([]);
          this.ventasLoading.set(false);
        },
      });
  }

  setPageSize(v: string) {
    this.pageSize.set(Number(v) || 20);
    this.page.set(1);
    this.cargarVentas();
  }
  irAPagina(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.cargarVentas();
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

  // --- Acciones (reusan los sheets de la lista) ---

  editar() {
    const c = this.cliente();
    if (!c) return;
    this.sheetService.create({
      zTitle: `Editar ${c.nombre}`,
      zDescription: 'Modifica los datos de contacto.',
      zContent: ClienteFormSheetComponent,
      zData: { cliente: c },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Cliente actualizado', 'No se pudo actualizar el cliente'),
    });
  }

  abonar() {
    const c = this.cliente();
    if (!c) return;
    this.sheetService.create({
      zTitle: 'Registrar abono',
      zDescription: 'Pago del cliente contra su deuda.',
      zContent: ClienteCreditoSheetComponent,
      zData: { cliente: c, modo: 'abono' },
      zOkText: 'Registrar abono',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Abono registrado', 'No se pudo registrar el abono'),
    });
  }

  cambiarLimite() {
    const c = this.cliente();
    if (!c) return;
    this.sheetService.create({
      zTitle: 'Límite de crédito',
      zDescription: `Ajusta cuánto puede deber ${c.nombre}.`,
      zContent: ClienteCreditoSheetComponent,
      zData: { cliente: c, modo: 'limite' },
      zOkText: 'Guardar límite',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Límite actualizado', 'No se pudo cambiar el límite'),
    });
  }

  private persistir(instance: any, okMsg: string, errMsg: string): Promise<void> | false {
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: () => {
          this.sonner.success(okMsg);
          this.cargarCliente();
          resolve();
        },
        error: (err: any) => {
          this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? errMsg);
          reject(err);
        },
      });
    });
  }
}
