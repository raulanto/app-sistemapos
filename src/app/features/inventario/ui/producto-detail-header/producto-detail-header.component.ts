import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePackage,
  lucideLayers,
  lucideBarcode,
  lucideTag,
  lucideBoxes,
  lucideEdit,
  lucideBan,
  lucideCircleCheck,
  lucideTrash,
  lucideArrowRightLeft,
  lucidePlus,
  lucideWallet,
  lucideTrendingUp,
} from '@ng-icons/lucide';

import { ProductoResponse } from '../../data-access/inventario.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardSeparatorComponent } from '../../../../shared/components/separator/separator.component';

@Component({
  selector: 'app-producto-detail-header',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardSeparatorComponent,
  ],
  template: `
    <div class="space-y-4">
      <!-- Top header bar: Title, status badge, metadata tags, and top-right actions -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {{ producto().nombre }}
            </h1>
            <z-badge
              [zType]="producto().activo ? 'default' : 'destructive'"
              class="capitalize font-medium"
            >
              {{ producto().activo ? 'Activo' : 'Inactivo' }}
            </z-badge>
            @if (producto().tipo === 'kit') {
              <z-badge zType="secondary">Kit</z-badge>
            } @else if (producto().tipo === 'fraccionable') {
              <z-badge zType="secondary">Fraccionable</z-badge>
            } @else if (producto().tipo === 'servicio') {
              <z-badge zType="secondary">Servicio</z-badge>
            }
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span class="font-mono bg-muted/80 px-2 py-0.5 rounded text-foreground/80 font-medium">
              SKU: {{ producto().sku }}
            </span>
            <span>•</span>
            <span
              >Categoría:
              <strong class="font-medium text-foreground/80">{{
                producto().categoria?.nombre || 'General'
              }}</strong></span
            >
            <span>•</span>
            <span
              >Unidad base:
              <strong class="font-medium text-foreground/80">{{
                producto().unidad_medida
              }}</strong></span
            >
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          @if (canEditar()) {
            <button z-button zType="outline" zSize="sm" (click)="edit.emit()">
              <ng-icon name="lucideEdit" class="mr-1.5 size-4" />
              Editar
            </button>
            @if (producto().activo) {
              <button
                z-button
                zType="outline"
                zSize="sm"
                class="text-destructive hover:bg-destructive/10"
                (click)="desactivar.emit()"
              >
                <ng-icon name="lucideBan" class="mr-1.5 size-4" />
                Desactivar
              </button>
            } @else {
              <button z-button zType="outline" zSize="sm" (click)="activar.emit()">
                <ng-icon name="lucideCircleCheck" class="mr-1.5 size-4" />
                Activar
              </button>
            }
            <button z-button zType="destructive" zSize="sm" (click)="eliminar.emit()">
              <ng-icon name="lucideTrash" class="mr-1.5 size-4" />
              Eliminar
            </button>
          }
          @if (canCrearMovimiento()) {
            @if (canEditar()) {
              <z-separator zOrientation="vertical" class="mx-0.5 h-6" />
            }
            <button z-button zType="secondary" zSize="sm" (click)="transferir.emit()">
              <ng-icon name="lucideArrowRightLeft" class="mr-1.5 size-4" />
              Transferir
            </button>
            <button z-button zType="default" zSize="sm" (click)="movimiento.emit()">
              <ng-icon name="lucidePlus" class="mr-1.5 size-4" />
              Movimiento
            </button>
          }
        </div>
      </div>

      <!-- Description if available -->
      @if (producto().descripcion) {
        <p class="max-w-3xl text-sm text-muted-foreground leading-relaxed">
          {{ producto().descripcion }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucidePackage,
      lucideLayers,
      lucideBarcode,
      lucideTag,
      lucideBoxes,
      lucideEdit,
      lucideBan,
      lucideCircleCheck,
      lucideTrash,
      lucideArrowRightLeft,
      lucidePlus,
      lucideWallet,
      lucideTrendingUp,
    }),
  ],
})
export class ProductoDetailHeaderComponent {
  producto = input.required<ProductoResponse>();
  imagenPrincipal = input<string | null>(null);
  imagenError = input<boolean>(false);
  canEditar = input<boolean>(false);
  canCrearMovimiento = input<boolean>(false);
  valorCostoTotal = input<number>(0);
  valorVentaTotal = input<number>(0);

  edit = output<void>();
  desactivar = output<void>();
  activar = output<void>();
  eliminar = output<void>();
  transferir = output<void>();
  movimiento = output<void>();
  imagenErrorChange = output<boolean>();
}
