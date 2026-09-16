import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePackageOpen,
  lucidePlus,
  lucideEdit,
  lucideBan,
  lucideCircleCheck,
} from '@ng-icons/lucide';

import { UnidadResponse } from '../../data-access/inventario.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';

@Component({
  selector: 'app-producto-tab-presentaciones',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ...ZardCardImports,
    ...ZardTableImports,
    ZardEmptyComponent,
  ],
  template: `
    <div class="space-y-4 pt-4">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div class="flex items-center gap-2">
          <ng-icon name="lucidePackageOpen" class="size-4 text-muted-foreground" />
          <h3 class="font-semibold text-foreground">Presentaciones de venta</h3>
          <z-badge zType="secondary" class="tabular-nums font-mono">{{ unidades().length }}</z-badge>
        </div>
        @if (canEditar()) {
          <button z-button zType="outline" zSize="sm" (click)="add.emit()">
            <ng-icon name="lucidePlus" class="mr-1.5 size-4" />
            Agregar presentación
          </button>
        }
      </div>

      <div z-card class="overflow-hidden p-0 border rounded-xl">
        <div class="divide-y divide-border">
          @for (unidad of unidades(); track unidad.id) {
            <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors">
              <div class="flex items-center gap-4">
                <div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40 shadow-2xs">
                  @if (portadasUnidad()[unidad.id]; as src) {
                    <img
                      [src]="src"
                      [alt]="unidad.nombre"
                      class="size-full object-cover"
                    />
                  } @else {
                    <ng-icon
                      name="lucidePackageOpen"
                      class="size-5 text-muted-foreground"
                    />
                  }
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-foreground text-sm sm:text-base">{{ unidad.nombre }}</span>
                    @if (!unidad.activo) {
                      <z-badge zType="destructive" class="text-[10px]">Inactiva</z-badge>
                    }
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span class="font-mono bg-muted/60 px-2 py-0.5 rounded text-foreground/80 font-medium">
                      {{ unidad.unidad_medida }}
                    </span>
                    <span>•</span>
                    <span>{{ describirEquivalenciaFn()(unidad) }}</span>
                    @if (unidad.codigo_barras) {
                      <span>•</span>
                      <span class="font-mono">Barras: {{ unidad.codigo_barras }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-6 sm:justify-end">
                <div class="text-left sm:text-right">
                  <span class="text-[10px] uppercase font-semibold text-muted-foreground block">Precio Venta</span>
                  <span class="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {{ unidad.precio_venta | currency }}
                  </span>
                </div>

                @if (canEditar()) {
                  <div class="flex items-center gap-1 border-l pl-4 sm:pl-6">
                    @if (unidad.activo) {
                      <button
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="edit.emit(unidad)"
                        aria-label="Editar presentación"
                        title="Editar"
                      >
                        <ng-icon name="lucideEdit" class="size-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        class="text-destructive hover:bg-destructive/10"
                        (click)="desactivar.emit(unidad)"
                        aria-label="Desactivar presentación"
                        title="Desactivar"
                      >
                        <ng-icon name="lucideBan" class="size-4" />
                      </button>
                    } @else {
                      <button
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        class="text-green-600 hover:bg-green-500/10"
                        (click)="reactivar.emit(unidad)"
                        aria-label="Reactivar presentación"
                        title="Reactivar"
                      >
                        <ng-icon name="lucideCircleCheck" class="size-4" />
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          } @empty {
            <z-empty
              zIcon="lucidePackageOpen"
              zTitle="Sin presentaciones"
              zDescription="El producto se vende únicamente en su unidad base."
              class="py-12"
            />
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucidePackageOpen,
      lucidePlus,
      lucideEdit,
      lucideBan,
      lucideCircleCheck,
    }),
  ],
})
export class ProductoTabPresentacionesComponent {
  unidades = input.required<UnidadResponse[]>();
  portadasUnidad = input<Record<string, string | null>>({});
  canEditar = input<boolean>(false);
  describirEquivalenciaFn = input.required<(u: UnidadResponse) => string>();

  add = output<void>();
  edit = output<UnidadResponse>();
  desactivar = output<UnidadResponse>();
  reactivar = output<UnidadResponse>();
}
