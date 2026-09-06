import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideArrowLeft } from '@ng-icons/lucide';

import { RolAdminService } from '../data-access/rol-admin.service';
import { RolResponse, RolQuery } from '../data-access/usuarios.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';

import { RolTableComponent } from '../ui/rol-table/rol-table.component';
import { RolFormSheetComponent } from '../ui/rol-form-sheet/rol-form-sheet.component';
import { RolPermisosSheetComponent } from '../ui/rol-permisos-sheet/rol-permisos-sheet.component';

@Component({
  selector: 'app-rol-list',
  standalone: true,
  imports: [RouterLink, NgIconComponent, ZardButtonComponent, RolTableComponent],
  viewProviders: [provideIcons({ lucidePlus, lucideArrowLeft })],
  templateUrl: './rol-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolListComponent {
  private readonly rolService = inject(RolAdminService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly authService = inject(AuthService);

  readonly canGestionar = computed(() => this.authService.hasPermission(...PERMISOS.roles.gestionar));

  readonly roles = signal<RolResponse[]>([]);
  readonly loading = signal(false);

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly sort = signal<string>('nombre:asc');

  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly refreshTrigger = signal(0);

  private readonly query = computed<RolQuery>(() => {
    this.refreshTrigger();
    return { page: this.page(), page_size: this.pageSize(), sort: this.sort() };
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => this.loading.set(true)),
        switchMap(query => this.rolService.listar(query)),
      )
      .subscribe({
        next: res => {
          this.roles.set(res.data);
          if (res.meta?.pagination) {
            this.totalItems.set(res.meta.pagination.total_items);
            this.totalPages.set(res.meta.pagination.total_pages);
          }
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar roles:', err);
          this.loading.set(false);
        },
      });
  }

  private refrescar() {
    this.refreshTrigger.update(v => v + 1);
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

  updatePageSize(val: string) {
    this.pageSize.set(parseInt(val, 10));
    this.page.set(1);
  }

  openCreateSheet() {
    this.sheetService.create({
      zTitle: 'Nuevo Rol',
      zDescription: 'Define un rol; luego asígnale permisos.',
      zContent: RolFormSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => this.persistir(instance, 'Rol creado exitosamente', 'Error al crear el rol'),
    });
  }

  openEditSheet(rol: RolResponse) {
    this.sheetService.create({
      zTitle: `Editar ${rol.nombre}`,
      zDescription: 'Modifica el nombre y la descripción del rol.',
      zContent: RolFormSheetComponent,
      zData: { rol },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => this.persistir(instance, 'Rol actualizado exitosamente', 'Error al actualizar el rol'),
    });
  }

  openPermisosSheet(rol: RolResponse) {
    this.sheetService.create({
      zTitle: `Permisos · ${rol.nombre}`,
      zDescription: 'Marca los permisos que tendrá este rol.',
      zContent: RolPermisosSheetComponent,
      zSize: 'lg',
      zData: { rol },
      zOkText: 'Guardar permisos',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) =>
        this.persistir(instance, 'Permisos actualizados correctamente', 'Error al actualizar los permisos'),
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
          console.error(errMsg, err);
          this.sonner.error(err?.error?.error?.message ?? errMsg);
          reject(err);
        },
      });
    });
  }

  eliminar(rol: RolResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Eliminar el rol ${rol.nombre}?`,
      zDescription:
        'No se puede eliminar si hay usuarios con este rol asignado. Reasígnalos primero a otro rol.',
      zOkText: 'Eliminar',
      zOkDestructive: true,
      zOnOk: () => {
        this.rolService.eliminar(rol.id).subscribe({
          next: () => {
            this.sonner.success('Rol eliminado correctamente');
            this.refrescar();
          },
          error: err => {
            console.error(err);
            if (err?.status === 409) {
              this.sonner.error(
                err?.error?.error?.message ?? 'Hay usuarios con este rol. Reasígnalos antes de eliminarlo.',
              );
            } else {
              this.sonner.error('Error al eliminar el rol');
            }
          },
        });
      },
    });
  }
}
