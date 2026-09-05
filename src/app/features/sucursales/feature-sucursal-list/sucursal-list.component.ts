import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideStore, lucideCircleCheck, lucideBan } from '@ng-icons/lucide';

import { SucursalAdminService } from '../data-access/sucursal-admin.service';
import { SucursalResponse, SucursalQuery } from '../data-access/sucursal.models';
import { SucursalService as SucursalGlobalService } from '@/core/sucursal/sucursal.service';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';

import { SucursalFiltrosComponent } from '../ui/sucursal-filtros/sucursal-filtros.component';
import { SucursalTableComponent } from '../ui/sucursal-table/sucursal-table.component';
import { SucursalFormSheetComponent } from '../ui/sucursal-form-sheet/sucursal-form-sheet.component';

@Component({
  selector: 'app-sucursal-list',
  standalone: true,
  imports: [
    NgIconComponent,
    ...ZardCardImports,
    ZardButtonComponent,
    SucursalFiltrosComponent,
    SucursalTableComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideStore, lucideCircleCheck, lucideBan })],
  templateUrl: './sucursal-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SucursalListComponent {
  private readonly sucursalService = inject(SucursalAdminService);
  private readonly sucursalGlobal = inject(SucursalGlobalService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly sheetService = inject(ZardSheetService);

  readonly sucursales = signal<SucursalResponse[]>([]);
  readonly loading = signal(false);

  // Filtros y paginación
  readonly q = signal<string>('');
  readonly activo = signal<boolean | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sort = signal<string>('nombre:asc');

  // Metadatos
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly refreshTrigger = signal(0);

  // Resumen (independiente de filtros/paginación de la tabla)
  readonly totalSucursales = signal(0);
  readonly totalActivas = signal(0);
  readonly totalInactivas = signal(0);

  private readonly query = computed<SucursalQuery>(() => {
    this.refreshTrigger();
    return {
      q: this.q() || null,
      activo: this.activo(),
      page: this.page(),
      page_size: this.pageSize(),
      sort: this.sort(),
    };
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => this.loading.set(true)),
        debounceTime(300),
        switchMap(query => this.sucursalService.listar(query)),
      )
      .subscribe({
        next: res => {
          this.sucursales.set(res.data);
          if (res.meta?.pagination) {
            this.totalItems.set(res.meta.pagination.total_items);
            this.totalPages.set(res.meta.pagination.total_pages);
          }
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar sucursales:', err);
          this.loading.set(false);
        },
      });

    this.cargarResumen();
  }

  private cargarResumen() {
    this.sucursalService.listar({ page_size: 100 }).subscribe({
      next: res => {
        const data = res.data;
        this.totalSucursales.set(res.meta?.pagination?.total_items ?? data.length);
        this.totalActivas.set(data.filter(s => s.activo).length);
        this.totalInactivas.set(data.filter(s => !s.activo).length);
      },
      error: err => console.error('Error al cargar el resumen de sucursales:', err),
    });
  }

  private refrescarTodo() {
    this.refreshTrigger.update(v => v + 1);
    this.cargarResumen();
    // Mantiene sincronizado el selector global de sucursales (movimientos, transferencias, etc.).
    this.sucursalGlobal.cargarSucursales();
  }

  updateSearch(val: string) {
    this.q.set(val);
    this.page.set(1);
  }

  updateActivo(val: boolean | null) {
    this.activo.set(val);
    this.page.set(1);
  }

  updatePageSize(val: string) {
    this.pageSize.set(parseInt(val, 10));
    this.page.set(1);
  }

  toggleSort(field: string) {
    const current = this.sort();
    if (current.startsWith(field)) {
      const isAsc = current.endsWith(':asc');
      this.sort.set(`${field}:${isAsc ? 'desc' : 'asc'}`);
    } else {
      this.sort.set(`${field}:asc`);
    }
    this.page.set(1);
  }

  openCreateSheet() {
    this.sheetService.create({
      zTitle: 'Nueva Sucursal',
      zDescription: 'Registra una nueva sucursal en el sistema.',
      zContent: SucursalFormSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Sucursal creada exitosamente');
              this.refrescarTodo();
              resolve();
            },
            error: (err: any) => {
              console.error(err);
              this.sonner.error('Error al crear la sucursal');
              reject(err);
            },
          });
        });
      },
    });
  }

  openEditSheet(sucursal: SucursalResponse) {
    this.sheetService.create({
      zTitle: `Editar ${sucursal.nombre}`,
      zDescription: 'Modifica los datos de la sucursal.',
      zContent: SucursalFormSheetComponent,
      zData: { sucursalId: sucursal.id },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Sucursal actualizada exitosamente');
              this.refrescarTodo();
              resolve();
            },
            error: (err: any) => {
              console.error(err);
              this.sonner.error('Error al actualizar la sucursal');
              reject(err);
            },
          });
        });
      },
    });
  }

  desactivar(sucursal: SucursalResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar ${sucursal.nombre}?`,
      zDescription: 'La sucursal dejará de estar disponible para nuevos movimientos y ventas.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.sucursalService.desactivar(sucursal.id).subscribe({
          next: () => {
            this.sonner.success('Sucursal desactivada correctamente');
            this.refrescarTodo();
          },
          error: (err) => {
            console.error(err);
            this.sonner.error('Error al desactivar la sucursal');
          },
        });
      },
    });
  }

  activar(sucursal: SucursalResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Activar ${sucursal.nombre}?`,
      zDescription: 'La sucursal volverá a estar disponible.',
      zOkText: 'Activar',
      zOnOk: () => {
        this.sucursalService.reactivar(sucursal.id).subscribe({
          next: () => {
            this.sonner.success('Sucursal activada correctamente');
            this.refrescarTodo();
          },
          error: (err) => {
            console.error(err);
            this.sonner.error('Error al activar la sucursal');
          },
        });
      },
    });
  }
}
