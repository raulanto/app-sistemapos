import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucidePencil, lucideTrash } from '@ng-icons/lucide';

import { CategoriaService } from '../data-access/categoria.service';
import { CategoriaResponse } from '../data-access/inventario.models';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [NgIcon, ...ZardTableImports, ...ZardCardImports, ZardButtonComponent, ZardBadgeComponent],
  viewProviders: [
    provideIcons({ lucidePlus, lucidePencil, lucideTrash })
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Categorías</h1>
          <p class="text-muted-foreground">Agrupa tus productos de forma organizada.</p>
        </div>
        @if (canCrear()) {
          <button z-button zType="default">
            <ng-icon name="lucidePlus" class="mr-2" /> Nueva Categoría
          </button>
        }
      </div>

      <div z-card>
        <z-card-content class="p-0">
          <table z-table>
            <thead z-table-header>
              <tr z-table-row>
                <th z-table-head>Nombre</th>
                <th z-table-head>Estado</th>
                <th z-table-head class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (categoria of categorias(); track categoria.id) {
                <tr z-table-row>
                  <td z-table-cell class="font-medium">{{ categoria.nombre }}</td>
                  <td z-table-cell>
                    <z-badge [zType]="categoria.activo ? 'default' : 'secondary'">
                      {{ categoria.activo ? 'Activo' : 'Inactivo' }}
                    </z-badge>
                  </td>
                  <td z-table-cell class="text-right space-x-2">
                    @if (canEditar()) {
                      <button z-button zType="ghost" zSize="icon" class="h-8 w-8 text-primary">
                        <ng-icon name="lucidePencil" class="size-4" />
                        <span class="sr-only">Editar</span>
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr z-table-row>
                  <td z-table-cell colspan="3" class="h-24 text-center text-muted-foreground">
                    No hay categorías registradas
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </z-card-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriaListComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));
  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.inventario.editar));

  readonly categorias = signal<CategoriaResponse[]>([]);

  ngOnInit() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al cargar categorias:', err)
    });
  }
}
