import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBoxes, lucideMapPin, lucideSettings2 } from '@ng-icons/lucide';

import { ProductoResponse, DesgloseExistenciasResponse, ExistenciaResponse } from '../../data-access/inventario.models';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-producto-tab-existencias',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    ...ZardCardImports,
    ZardBadgeComponent,
    ...ZardTableImports,
    ZardEmptyComponent,
    ZardButtonComponent,
  ],
  template: `
    <div class="space-y-6 pt-4">
      @if (desglose(); as dg) {
        @if (dg.presentaciones_global.length > 1) {
          <div z-card class="mb-6">
            <z-card-header>
              <z-card-title zTitle="Disponible por presentación" class="text-base" />
              <z-card-description
                [zDescription]="
                  'Total en todas las sucursales · ' +
                  dg.cantidad_base_global +
                  ' ' +
                  (dg.unidad_base || producto().unidad_medida) +
                  ' base'
                "
              />
            </z-card-header>
            <z-card-content class="pt-2">
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                @for (p of dg.presentaciones_global; track p.producto_unidad_id ?? 'base') {
                  <div class="rounded-xl border p-4 bg-card/60 shadow-2xs">
                    <p class="text-2xl font-bold tabular-nums text-foreground">
                      {{ p.cantidad_entera | number }}
                    </p>
                    <p class="text-sm font-semibold text-foreground/90 mt-0.5">{{ p.nombre }}</p>
                    <p class="text-xs text-muted-foreground tabular-nums mt-1">
                      {{ p.cantidad }} exactas
                      @if (p.producto_unidad_id) {
                        · 1 = {{ p.factor }} {{ dg.unidad_base || producto().unidad_medida }}
                      }
                    </p>
                  </div>
                }
              </div>
            </z-card-content>
          </div>
        }
      }

      <div class="space-y-3 pt-2">
        <div class="flex items-center gap-2">
          <ng-icon name="lucideBoxes" class="size-4 text-muted-foreground" />
          <h3 class="font-semibold text-foreground">Stock por sucursal</h3>
          <z-badge zType="secondary" class="tabular-nums">{{
            producto().existencias?.length || 0
          }}</z-badge>
        </div>
        <div z-card class="overflow-hidden py-0">
        <div class="overflow-x-auto">
          <table z-table>
            <thead z-table-header class="bg-muted/50">
              <tr z-table-row>
                <th z-table-head>Sucursal</th>
                <th z-table-head class="text-right">Disponible</th>
                <th z-table-head class="text-right">Stock mínimo</th>
                <th z-table-head class="text-right">Stock máximo</th>
                <th z-table-head class="w-16 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (ext of producto().existencias; track ext.id) {
                <tr z-table-row>
                  <td z-table-cell class="font-medium">
                    <span class="flex items-center gap-2">
                      <ng-icon name="lucideMapPin" class="size-4 text-muted-foreground" />
                      <span>
                        {{ getNombreSucursalFn()(ext.sucursal_id) }}
                        @if (ext.updated_at) {
                          <span class="block text-xs font-normal text-muted-foreground"
                            >Actualizado {{ ext.updated_at | date: 'dd/MM/yyyy' }}</span
                          >
                        }
                      </span>
                    </span>
                  </td>
                  <td z-table-cell class="text-right">
                    <z-badge
                      [zType]="
                        ext.cantidad <= (ext.stock_minimo || 0) ? 'destructive' : 'secondary'
                      "
                      class="tabular-nums"
                    >
                      {{ ext.cantidad }}
                    </z-badge>
                  </td>
                  <td z-table-cell class="text-right tabular-nums text-muted-foreground">
                    {{ ext.stock_minimo || '—' }}
                  </td>
                  <td z-table-cell class="text-right tabular-nums text-muted-foreground">
                    {{ ext.stock_maximo || '—' }}
                  </td>
                  <td z-table-cell class="text-center">
                    @if (canEditar()) {
                      <button
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="openUmbrales.emit(ext)"
                        aria-label="Configurar umbrales"
                      >
                        <ng-icon name="lucideSettings2" class="size-4" />
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr z-table-row>
                  <td z-table-cell colspan="5" class="p-0">
                    <z-empty
                      zIcon="lucideMapPin"
                      zTitle="Sin existencias"
                      zDescription="Este producto no tiene stock registrado en ninguna sucursal."
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
      lucideBoxes,
      lucideMapPin,
      lucideSettings2,
    }),
  ],
})
export class ProductoTabExistenciasComponent {
  producto = input.required<ProductoResponse>();
  desglose = input<DesgloseExistenciasResponse | null>(null);
  canEditar = input<boolean>(false);
  getNombreSucursalFn = input.required<(id: string) => string>();

  openUmbrales = output<ExistenciaResponse>();
}
