import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucidePencil,
  lucideBan,
  lucideCheckCircle2,
  lucideTag,
  lucideTrash,
  lucideRefreshCw,
  lucideSearch,
} from '@ng-icons/lucide';

import { MarcaService } from '../data-access/services/marca.service';
import { MarcaResponse } from '../data-access/models/marca.model';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { MarcaFormSheetComponent } from '../ui/marca-form-sheet/marca-form-sheet.component';

@Component({
  selector: 'app-marca-list',
  standalone: true,
  imports: [
    FormsModule,
    NgIcon,
    ...ZardCardImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardInputComponent,
  ],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucidePencil,
      lucideBan,
      lucideCheckCircle2,
      lucideTag,
      lucideTrash,
      lucideRefreshCw,
      lucideSearch,
    }),
  ],
  templateUrl: 'marca-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarcaListComponent {
  private marcaService = inject(MarcaService);
  private authService = inject(AuthService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));
  readonly canEditar = computed(() =>
    this.authService.hasPermission(...PERMISOS.inventario.editar),
  );
  readonly canEliminar = computed(() =>
    this.authService.hasPermission(...PERMISOS.inventario.eliminar),
  );

  readonly marcas = signal<MarcaResponse[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly busqueda = signal('');

  readonly marcasFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const list = this.marcas();
    if (!q) return list;
    return list.filter((m) => m.nombre.toLowerCase().includes(q));
  });

  readonly totalMarcas = computed(() => this.marcas().length);
  readonly totalActivas = computed(() => this.marcas().filter((m) => m.activo).length);

  constructor() {
    this.cargar();
  }

  cargar(manual = false) {
    if (manual) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }

    this.marcaService.listar({ page_size: 100, sort: 'nombre' }).subscribe({

      next: (res) => {
        this.marcas.set(res.data);
        this.loading.set(false);
        this.refreshing.set(false);
        if (manual) {
          this.sonner.success('Marcas actualizadas');
        }
      },
      error: (err) => {
        console.error('Error al cargar marcas:', err);
        this.loading.set(false);
        this.refreshing.set(false);
        this.sonner.error('Error al recargar el catálogo de marcas');
      },
    });
  }

  openCreateSheet() {
    this.sheetService.create({
      zTitle: 'Nueva marca',
      zDescription: 'Registra una marca para asociarla a tus productos.',
      zContent: MarcaFormSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: MarcaFormSheetComponent) =>
        this.persistir(instance, 'Marca creada', 'Error al crear la marca'),
    });
  }

  openEditSheet(marca: MarcaResponse) {
    this.sheetService.create({
      zTitle: `Editar ${marca.nombre}`,
      zDescription: 'Modifica la información de la marca.',
      zContent: MarcaFormSheetComponent,
      zData: { marca },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: MarcaFormSheetComponent) =>
        this.persistir(instance, 'Marca actualizada', 'Error al actualizar la marca'),
    });
  }

  private persistir(instance: MarcaFormSheetComponent, okMsg: string, errMsg: string): Promise<void> | false {
    if (instance.submitting()) return false;
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: () => {
          this.sonner.success(okMsg);
          this.cargar();
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

  activar(marca: MarcaResponse) {
    this.marcaService.activar(marca.id).subscribe({
      next: () => {
        this.sonner.success('Marca activada');
        this.cargar();
      },
      error: (err) => {
        console.error(err);
        this.sonner.error(err?.error?.error?.message ?? 'No se pudo activar la marca');
      },
    });
  }

  desactivar(marca: MarcaResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar ${marca.nombre}?`,
      zDescription: 'Los productos asociados conservarán su marca pero no podrá seleccionarse para nuevos productos.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.marcaService.desactivar(marca.id).subscribe({
          next: () => {
            this.sonner.success('Marca desactivada');
            this.cargar();
          },
          error: (err) => {
            console.error(err);
            this.sonner.error(err?.error?.error?.message ?? 'No se pudo desactivar la marca');
          },
        });
      },
    });
  }

  eliminar(marca: MarcaResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Eliminar ${marca.nombre}?`,
      zDescription: 'Esta acción eliminará la marca de forma permanente.',
      zOkText: 'Eliminar',
      zOkDestructive: true,
      zOnOk: () => {
        this.marcaService.eliminar(marca.id).subscribe({
          next: () => {
            this.sonner.success('Marca eliminada permanentemente');
            this.cargar();
          },
          error: (err) => {
            console.error(err);
            this.sonner.error(err?.error?.error?.message ?? 'No se pudo eliminar la marca');
          },
        });
      },
    });
  }
}


