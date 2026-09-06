import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideUsers, lucideCircleCheck, lucideBan, lucideShieldCheck } from '@ng-icons/lucide';

import { UsuarioAdminService } from '../data-access/usuario-admin.service';
import { UsuarioResponse, UsuarioQuery } from '../data-access/usuarios.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';

import { UsuarioTableComponent } from '../ui/usuario-table/usuario-table.component';
import { UsuarioFormSheetComponent } from '../ui/usuario-form-sheet/usuario-form-sheet.component';
import { UsuarioRolSheetComponent } from '../ui/usuario-rol-sheet/usuario-rol-sheet.component';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ZardButtonComponent,
    UsuarioTableComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideUsers, lucideCircleCheck, lucideBan, lucideShieldCheck })],
  templateUrl: './usuario-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioListComponent {
  private readonly usuarioService = inject(UsuarioAdminService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly authService = inject(AuthService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.usuarios.crear));
  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.usuarios.editar));
  readonly canDesactivar = computed(() => this.authService.hasPermission(...PERMISOS.usuarios.desactivar));

  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly loading = signal(false);

  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sort = signal<string>('nombre:asc');

  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly refreshTrigger = signal(0);

  readonly totalUsuarios = signal(0);
  readonly totalActivos = signal(0);
  readonly totalInactivos = signal(0);

  private readonly query = computed<UsuarioQuery>(() => {
    this.refreshTrigger();
    return {
      page: this.page(),
      page_size: this.pageSize(),
      sort: this.sort(),
      include: 'rol,sucursal',
    };
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => this.loading.set(true)),
        switchMap(query => this.usuarioService.listar(query)),
      )
      .subscribe({
        next: res => {
          this.usuarios.set(res.data);
          if (res.meta?.pagination) {
            this.totalItems.set(res.meta.pagination.total_items);
            this.totalPages.set(res.meta.pagination.total_pages);
          }
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar usuarios:', err);
          this.loading.set(false);
        },
      });

    this.cargarResumen();
  }

  private cargarResumen() {
    this.usuarioService.listar({ page_size: 100, include: 'rol' }).subscribe({
      next: res => {
        const data = res.data;
        this.totalUsuarios.set(res.meta?.pagination?.total_items ?? data.length);
        this.totalActivos.set(data.filter(u => u.activo).length);
        this.totalInactivos.set(data.filter(u => !u.activo).length);
      },
      error: err => console.error('Error al cargar el resumen de usuarios:', err),
    });
  }

  private refrescarTodo() {
    this.refreshTrigger.update(v => v + 1);
    this.cargarResumen();
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
      zTitle: 'Nuevo Usuario',
      zDescription: 'Registra un usuario y asígnale un rol.',
      zContent: UsuarioFormSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => this.persistir(instance, 'Usuario creado exitosamente', 'Error al crear el usuario'),
    });
  }

  openEditSheet(usuario: UsuarioResponse) {
    this.sheetService.create({
      zTitle: `Editar ${usuario.nombre}`,
      zDescription: 'Modifica el perfil del usuario.',
      zContent: UsuarioFormSheetComponent,
      zData: { usuarioId: usuario.id },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) =>
        this.persistir(instance, 'Usuario actualizado exitosamente', 'Error al actualizar el usuario'),
    });
  }

  openRolSheet(usuario: UsuarioResponse) {
    this.sheetService.create({
      zTitle: `Cambiar rol`,
      zDescription: 'Asigna un rol distinto a este usuario.',
      zContent: UsuarioRolSheetComponent,
      zData: { usuarioId: usuario.id, rolActualId: usuario.rol_id, nombre: usuario.nombre },
      zOkText: 'Cambiar rol',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => this.persistir(instance, 'Rol actualizado correctamente', 'Error al cambiar el rol'),
    });
  }

  private persistir(instance: any, okMsg: string, errMsg: string): Promise<void> | false {
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: () => {
          this.sonner.success(okMsg);
          this.refrescarTodo();
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

  desactivar(usuario: UsuarioResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar a ${usuario.nombre}?`,
      zDescription: 'El usuario no podrá iniciar sesión hasta que se reactive.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.usuarioService.desactivar(usuario.id).subscribe({
          next: () => {
            this.sonner.success('Usuario desactivado correctamente');
            this.refrescarTodo();
          },
          error: err => {
            console.error(err);
            this.sonner.error(err?.error?.error?.message ?? 'Error al desactivar el usuario');
          },
        });
      },
    });
  }
}
