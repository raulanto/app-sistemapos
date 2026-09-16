import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTruck, lucidePlus, lucideStar, lucideTrash } from '@ng-icons/lucide';

import { ProductoProveedorResponse } from '../../../proveedores/data-access/proveedores.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';

export interface ProveedorFila {
  link: ProductoProveedorResponse;
  nombreProveedor: string;
}

@Component({
  selector: 'app-producto-tab-proveedores',
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
    ZardSkeletonComponent,
  ],
  template: `
    <div class="space-y-3 pt-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <ng-icon name="lucideTruck" class="size-4 text-muted-foreground" />
          <h3 class="font-semibold">Proveedores de este producto</h3>
          <z-badge zType="secondary" class="tabular-nums">{{
            proveedoresProducto().length
          }}</z-badge>
        </div>
        @if (canGestionarProveedores()) {
          <button z-button zType="outline" zSize="sm" (click)="add.emit()">
            <ng-icon name="lucidePlus" class="mr-2 size-4" />
            Vincular proveedor
          </button>
        }
      </div>
      @if (cargando()) {
        <z-skeleton class="h-24 w-full" />
      } @else {
        <div z-card class="overflow-hidden py-0">
          <div class="overflow-x-auto">
            <table z-table>
              <thead z-table-header class="bg-muted/50">
                <tr z-table-row>
                  <th z-table-head>Proveedor</th>
                  <th z-table-head class="text-right">Precio compra</th>
                  <th z-table-head class="text-right">Stock mínimo</th>
                  <th z-table-head class="text-right">Reorden</th>
                  <th z-table-head>Estado</th>
                  <th z-table-head class="w-24 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody z-table-body>
                @for (f of proveedoresProducto(); track f.link.id) {
                  <tr z-table-row>
                    <td z-table-cell class="font-medium">
                      <a
                        [routerLink]="['/proveedores', f.link.proveedor_id]"
                        class="text-primary hover:underline"
                      >
                        {{ f.nombreProveedor }}
                      </a>
                      @if (f.link.es_proveedor_principal) {
                        <z-badge zType="secondary" class="ml-2">Principal</z-badge>
                      }
                    </td>
                    <td z-table-cell class="text-right tabular-nums">
                      {{ f.link.precio_compra | currency }}
                    </td>
                    <td z-table-cell class="text-right tabular-nums">
                      {{ f.link.stock_minimo }}
                    </td>
                    <td z-table-cell class="text-right tabular-nums">
                      {{ f.link.cantidad_reorden }}
                    </td>
                    <td z-table-cell>
                      <z-badge [zType]="f.link.activo ? 'default' : 'outline'">{{
                        f.link.activo ? 'Activo' : 'Inactivo'
                      }}</z-badge>
                    </td>
                    <td z-table-cell class="text-center">
                      @if (canGestionarProveedores() && f.link.activo) {
                        @if (!f.link.es_proveedor_principal) {
                          <button
                            z-button
                            zType="ghost"
                            zSize="icon-sm"
                            title="Marcar principal"
                            (click)="marcarPrincipal.emit(f)"
                          >
                            <ng-icon name="lucideStar" class="size-4" />
                          </button>
                        }
                        <button
                          z-button
                          zType="ghost"
                          zSize="icon-sm"
                          class="text-destructive hover:bg-destructive/10"
                          title="Desvincular"
                          (click)="desvincular.emit(f)"
                        >
                          <ng-icon name="lucideTrash" class="size-4" />
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr z-table-row>
                    <td z-table-cell colspan="6" class="p-0">
                      <z-empty
                        zIcon="lucideTruck"
                        zTitle="Sin proveedores vinculados"
                        zDescription="Vincula de dónde se compra este producto para activar el reorden automático."
                        class="py-10"
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideTruck,
      lucidePlus,
      lucideStar,
      lucideTrash,
    }),
  ],
})
export class ProductoTabProveedoresComponent {
  proveedoresProducto = input.required<ProveedorFila[]>();
  cargando = input<boolean>(true);
  canGestionarProveedores = input<boolean>(false);

  add = output<void>();
  marcarPrincipal = output<ProveedorFila>();
  desvincular = output<ProveedorFila>();
}
