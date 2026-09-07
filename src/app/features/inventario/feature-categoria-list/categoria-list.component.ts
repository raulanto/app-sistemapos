import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucidePencil,
  lucideBan,
  lucideFolderTree,
  lucideCornerDownRight,
} from '@ng-icons/lucide';

import { CategoriaService } from '../data-access/categoria.service';
import { CategoriaResponse } from '../data-access/inventario.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { CategoriaFormSheetComponent } from '../ui/categoria-form-sheet/categoria-form-sheet.component';

interface Rama {
  padre: CategoriaResponse;
  hijas: CategoriaResponse[];
}

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    NgIcon,
    ...ZardCardImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({ lucidePlus, lucidePencil, lucideBan, lucideFolderTree, lucideCornerDownRight }),
  ],
  templateUrl: 'categoria-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriaListComponent {
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));
  readonly canEditar = computed(() =>
    this.authService.hasPermission(...PERMISOS.inventario.editar),
  );

  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly loading = signal(true);

  /** Árbol de 2 niveles: raíces con sus hijas directas. */
  readonly arbol = computed<Rama[]>(() => {
    const cats = this.categorias();
    const ids = new Set(cats.map((c) => c.id));
    const hijasDe = new Map<string, CategoriaResponse[]>();
    const raices: CategoriaResponse[] = [];

    for (const c of cats) {
      const padreId = c.categoria_padre_id;
      if (padreId && ids.has(padreId)) {
        const lista = hijasDe.get(padreId) ?? [];
        lista.push(c);
        hijasDe.set(padreId, lista);
      } else {
        raices.push(c);
      }
    }

    const porNombre = (a: CategoriaResponse, b: CategoriaResponse) =>
      a.nombre.localeCompare(b.nombre);
    return raices
      .sort(porNombre)
      .map((padre) => ({ padre, hijas: (hijasDe.get(padre.id) ?? []).sort(porNombre) }));
  });

  readonly totalCategorias = computed(() => this.categorias().length);

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.loading.set(false);
      },
    });
  }

  openCreateSheet(padreSugeridoId?: string) {
    this.sheetService.create({
      zTitle: padreSugeridoId ? 'Nueva subcategoría' : 'Nueva categoría',
      zDescription: 'Agrupa tus productos. Puedes anidarla bajo otra categoría.',
      zContent: CategoriaFormSheetComponent,
      zData: { padreSugeridoId },
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) =>
        this.persistir(instance, 'Categoría creada', 'Error al crear la categoría'),
    });
  }

  openEditSheet(categoria: CategoriaResponse) {
    this.sheetService.create({
      zTitle: `Editar ${categoria.nombre}`,
      zDescription: 'Cambia el nombre o mueve la categoría de padre.',
      zContent: CategoriaFormSheetComponent,
      zData: { categoria },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) =>
        this.persistir(instance, 'Categoría actualizada', 'Error al actualizar la categoría'),
    });
  }

  private persistir(instance: any, okMsg: string, errMsg: string): Promise<void> | false {
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

  desactivar(categoria: CategoriaResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar ${categoria.nombre}?`,
      zDescription: 'No se puede si tiene productos o subcategorías activas.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.categoriaService.desactivar(categoria.id).subscribe({
          next: () => {
            this.sonner.success('Categoría desactivada');
            this.cargar();
          },
          error: (err) => {
            console.error(err);
            this.sonner.error(err?.error?.error?.message ?? 'No se pudo desactivar la categoría');
          },
        });
      },
    });
  }
}
