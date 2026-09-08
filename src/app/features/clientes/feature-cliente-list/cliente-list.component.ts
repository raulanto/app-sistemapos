import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideUsers,
  lucidePencil,
  lucideBan,
  lucideSearch,
  lucideWallet,
  lucideCreditCard,
  lucideRefreshCw,
  lucideX,
} from '@ng-icons/lucide';

import { ClienteService } from '../data-access/cliente.service';
import { ClienteResponse, ClienteQuery } from '../data-access/clientes.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';

import { ClienteFormSheetComponent } from '../ui/cliente-form-sheet/cliente-form-sheet.component';
import { ClienteCreditoSheetComponent } from '../ui/cliente-credito-sheet/cliente-credito-sheet.component';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CurrencyPipe,
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
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideUsers,
      lucidePencil,
      lucideBan,
      lucideSearch,
      lucideWallet,
      lucideCreditCard,
      lucideRefreshCw,
      lucideX,
    }),
  ],
  templateUrl: 'cliente-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteListComponent {
  private clienteService = inject(ClienteService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);
  private authService = inject(AuthService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.clientes.crear));
  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.clientes.editar));
  readonly canEliminar = computed(() => this.authService.hasPermission(...PERMISOS.clientes.eliminar));
  readonly canCredito = computed(() => this.authService.hasPermission(...PERMISOS.clientes.credito));

  readonly clientes = signal<ClienteResponse[]>([]);
  readonly loading = signal(true);

  readonly q = signal('');
  readonly activo = signal<'' | 'true' | 'false'>('');
  readonly conSaldo = signal(false);

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  private readonly refreshTick = signal(0);

  readonly hayFiltros = computed(() => !!this.q() || !!this.activo() || this.conSaldo());

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

  private readonly query = computed<ClienteQuery>(() => {
    this.refreshTick();
    return {
      q: this.q().trim() || undefined,
      activo: this.activo() === '' ? undefined : this.activo() === 'true',
      con_saldo_pendiente: this.conSaldo() || undefined,
      page: this.page(),
      page_size: this.pageSize(),
      sort: 'nombre:asc',
      include: 'sucursal',
    };
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        debounceTime(250),
        tap(() => this.loading.set(true)),
        switchMap(q => this.clienteService.listar(q).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe(res => {
        this.loading.set(false);
        if (!res) return;
        this.clientes.set(res.data);
        const p = res.meta?.pagination;
        this.totalItems.set(p?.total_items ?? res.data.length);
        this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
        if (p?.page && p.page !== this.page()) this.page.set(p.page);
      });
  }

  disponible(c: ClienteResponse): number {
    return Math.max(0, (Number(c.limite_credito) || 0) - (Number(c.saldo_credito) || 0));
  }

  // --- Filtros / paginación ---

  private volverAInicio() {
    if (this.page() !== 1) this.page.set(1);
    else this.refreshTick.update(v => v + 1);
  }
  setQ(v: string) {
    this.q.set(v);
    this.volverAInicio();
  }
  setActivo(v: string) {
    this.activo.set(v as '' | 'true' | 'false');
    this.volverAInicio();
  }
  setConSaldo(v: string) {
    this.conSaldo.set(v === 'true');
    this.volverAInicio();
  }
  limpiarFiltros() {
    this.q.set('');
    this.activo.set('');
    this.conSaldo.set(false);
    this.volverAInicio();
  }
  refrescar() {
    this.refreshTick.update(v => v + 1);
  }
  setPageSize(v: string) {
    this.pageSize.set(Number(v) || 20);
    this.volverAInicio();
  }
  irAPagina(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
  }
  prev() {
    this.irAPagina(this.page() - 1);
  }
  next() {
    this.irAPagina(this.page() + 1);
  }

  // --- Acciones ---

  nuevoCliente() {
    this.sheetService.create({
      zTitle: 'Nuevo cliente',
      zDescription: 'Datos de contacto y su límite de crédito.',
      zContent: ClienteFormSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Cliente creado', 'No se pudo crear el cliente'),
    });
  }

  editarCliente(cliente: ClienteResponse) {
    this.sheetService.create({
      zTitle: `Editar ${cliente.nombre}`,
      zDescription: 'Modifica los datos de contacto.',
      zContent: ClienteFormSheetComponent,
      zData: { cliente },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Cliente actualizado', 'No se pudo actualizar el cliente'),
    });
  }

  abonar(cliente: ClienteResponse) {
    this.sheetService.create({
      zTitle: 'Registrar abono',
      zDescription: 'Pago del cliente contra su deuda.',
      zContent: ClienteCreditoSheetComponent,
      zData: { cliente, modo: 'abono' },
      zOkText: 'Registrar abono',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Abono registrado', 'No se pudo registrar el abono'),
    });
  }

  cambiarLimite(cliente: ClienteResponse) {
    this.sheetService.create({
      zTitle: 'Límite de crédito',
      zDescription: `Ajusta cuánto puede deber ${cliente.nombre}.`,
      zContent: ClienteCreditoSheetComponent,
      zData: { cliente, modo: 'limite' },
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
          this.refrescar();
          resolve();
        },
        error: (err: any) => {
          this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? errMsg);
          reject(err);
        },
      });
    });
  }

  desactivar(cliente: ClienteResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar a ${cliente.nombre}?`,
      zDescription: 'No aparecerá para nuevas ventas a crédito. Su deuda y su historial se conservan.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.clienteService.desactivar(cliente.id).subscribe({
          next: () => {
            this.sonner.success('Cliente desactivado');
            this.refrescar();
          },
          error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo desactivar'),
        });
      },
    });
  }
}
