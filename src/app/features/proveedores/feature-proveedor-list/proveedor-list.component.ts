import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBan, lucideCircleCheck, lucidePencil, lucidePlus, lucideRefreshCw, lucideX } from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import { mensajeProveedorError, ProveedorResponse } from '../data-access/proveedores.models';
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
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ProveedorFormSheetComponent } from '../ui/proveedor-form-sheet/proveedor-form-sheet.component';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [
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
  viewProviders: [provideIcons({ lucideBan, lucideCircleCheck, lucidePencil, lucidePlus, lucideRefreshCw, lucideX })],
  templateUrl: './proveedor-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedorListComponent {
  private proveedorService = inject(ProveedorService);
  private authService = inject(AuthService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.proveedores.crear));
  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.proveedores.editar));

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly loading = signal(true);

  readonly q = signal('');
  readonly activo = signal<'true' | 'false' | ''>('true');

  readonly hayFiltros = computed(() => !!this.q().trim() || this.activo() !== 'true');

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
      .listar({
        q: this.q().trim() || undefined,
        activo: this.activo() === '' ? undefined : this.activo() === 'true',
        page: this.page(),
        page_size: this.pageSize(),
        sort: 'razon_social:asc',
      })
      .subscribe({
        next: res => {
          this.proveedores.set(res.data);
          const p = res.meta?.pagination;
          this.totalItems.set(p?.total_items ?? res.data.length);
          this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
          if (p?.page && p.page !== this.page()) this.page.set(p.page);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar proveedores', err);
          this.loading.set(false);
        },
      });
  }

  private recargarDesdeInicio() {
    this.page.set(1);
    this.cargar();
  }

  setQ(v: string) {
    this.q.set(v);
    this.recargarDesdeInicio();
  }
  setActivo(v: string) {
    this.activo.set(v as 'true' | 'false' | '');
    this.recargarDesdeInicio();
  }
  limpiarFiltros() {
    this.q.set('');
    this.activo.set('true');
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
      zTitle: 'Nuevo proveedor',
      zDescription: 'Da de alta un proveedor en el catálogo.',
      zContent: ProveedorFormSheetComponent,
      zSize: 'lg',
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => this.persistir(instance, 'Proveedor creado'),
    });
  }

  editar(p: ProveedorResponse, ev: Event) {
    ev.stopPropagation();
    this.sheetService.create({
      zTitle: `Editar ${p.codigo}`,
      zDescription: 'Actualiza los datos del proveedor.',
      zContent: ProveedorFormSheetComponent,
      zSize: 'lg',
      zData: { proveedor: p },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => this.persistir(instance, 'Proveedor actualizado'),
    });
  }

  private persistir(instance: any, okMsg: string): Promise<void> | false {
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: () => {
          this.sonner.success(okMsg);
          this.cargar();
          resolve();
        },
        error: (err: unknown) => {
          this.sonner.error(mensajeProveedorError(err, 'No se pudo guardar el proveedor'));
          reject(err);
        },
      });
    });
  }

  toggleActivo(p: ProveedorResponse, ev: Event) {
    ev.stopPropagation();
    const accion = p.activo ? 'Desactivar' : 'Activar';
    this.alertDialog.confirm({
      zTitle: `¿${accion} ${p.razon_social}?`,
      zDescription: p.activo
        ? 'Dejará de estar disponible para nuevos pedidos y vínculos.'
        : 'Volverá a estar disponible para pedidos y vínculos.',
      zOkText: accion,
      zOkDestructive: p.activo,
      zOnOk: () => {
        const obs = p.activo ? this.proveedorService.desactivar(p.id) : this.proveedorService.activar(p.id);
        obs.subscribe({
          next: () => {
            this.sonner.success(`Proveedor ${p.activo ? 'desactivado' : 'activado'}`);
            this.cargar();
          },
          error: err => this.sonner.error(mensajeProveedorError(err, `No se pudo ${accion.toLowerCase()} el proveedor`)),
        });
      },
    });
  }
}
