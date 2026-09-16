import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLayers, lucidePlus, lucideEdit, lucideTrash } from '@ng-icons/lucide';

import { ProductoResponse, ComponenteResponse } from '../../data-access/inventario.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';

@Component({
  selector: 'app-producto-tab-receta',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIconComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ...ZardCardImports,
    ...ZardTableImports,
    ZardEmptyComponent,
  ],
  template: `
    <div class="space-y-3 pt-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <ng-icon name="lucideLayers" class="size-4 text-muted-foreground" />
          <h3 class="font-semibold">Componentes de la receta</h3>
          <z-badge zType="secondary" class="tabular-nums">{{
            producto().componentes?.length || 0
          }}</z-badge>
        </div>
        @if (canEditar()) {
          <button z-button zType="outline" zSize="sm" (click)="add.emit()">
            <ng-icon name="lucidePlus" class="mr-2 size-4" />
            Agregar componente
          </button>
        }
      </div>
      <div z-card class="overflow-hidden py-0">
        <div class="overflow-x-auto">
          <table z-table>
            <thead z-table-header class="bg-muted/50">
              <tr z-table-row>
                <th z-table-head>Producto</th>
                <th z-table-head>SKU</th>
                <th z-table-head class="text-right">Cantidad</th>
                <th z-table-head class="w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (comp of producto().componentes; track comp.producto_componente_id) {
                <tr z-table-row>
                  <td z-table-cell class="font-medium">
                    <a
                      [routerLink]="['/inventario/productos', comp.producto_componente_id]"
                      class="text-primary hover:underline"
                    >
                      {{
                        comp.componente?.nombre || 'Producto ' + comp.producto_componente_id
                      }}
                    </a>
                  </td>
                  <td z-table-cell class="text-muted-foreground">
                    {{ comp.componente?.sku || '—' }}
                  </td>
                  <td z-table-cell class="text-right tabular-nums font-medium">
                    {{ comp.cantidad }}
                  </td>
                  <td z-table-cell class="text-center">
                    @if (canEditar()) {
                      <button
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="edit.emit(comp)"
                        aria-label="Editar componente"
                      >
                        <ng-icon name="lucideEdit" class="size-4" />
                      </button>
                      <button
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        class="text-destructive hover:bg-destructive/10"
                        (click)="remove.emit(comp)"
                        aria-label="Quitar componente"
                      >
                        <ng-icon name="lucideTrash" class="size-4" />
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr z-table-row>
                  <td z-table-cell colspan="4" class="p-0">
                    <z-empty
                      zIcon="lucideLayers"
                      zTitle="Kit sin componentes"
                      zDescription="Agrega los productos que conforman esta receta."
                      class="py-10"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideLayers,
      lucidePlus,
      lucideEdit,
      lucideTrash,
    }),
  ],
})
export class ProductoTabRecetaComponent {
  producto = input.required<ProductoResponse>();
  canEditar = input<boolean>(false);

  add = output<void>();
  edit = output<ComponenteResponse>();
  remove = output<ComponenteResponse>();
}
