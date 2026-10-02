import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePencil,
  lucideCircleCheck,
  lucideX,
  lucideActivity,
  lucideBan,
  lucidePackage,
  lucideLayers,
  lucideTrash2,
} from '@ng-icons/lucide';
import { ProductoResponse } from '../../data-access/inventario.models';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardSkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';

@Component({
  selector: 'app-producto-grid',
  standalone: true,
  imports: [
    RouterLink,
    NgIcon,
    CurrencyPipe,
    DecimalPipe,
    LowerCasePipe,
    ...ZardCardImports,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardSkeletonComponent,
    ZardEmptyComponent,
  ],
  providers: [
    provideIcons({
      lucidePencil,
      lucideCircleCheck,
      lucideX,
      lucideActivity,
      lucideBan,
      lucidePackage,
      lucideLayers,
      lucideTrash2,
    }),
  ],
  template: `
    <div class="mt-4">
      @if (loading()) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          @for (item of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track item) {
            <z-card class="overflow-hidden">
              <z-skeleton class="h-44 w-full" />
              <z-card-header class="p-3 space-y-2">
                <z-skeleton class="h-3 w-16" />
                <z-skeleton class="h-4 w-full" />
                <z-skeleton class="h-5 w-20" />
              </z-card-header>
            </z-card>
          }
        </div>
      } @else if (productos().length === 0) {
        <z-card class="p-8">
          <z-empty
            zIcon="lucideX"
            zTitle="Sin resultados"
            zDescription="No hay productos que coincidan con los filtros aplicados."
            class="py-8"
          />
        </z-card>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          @for (producto of productos(); track producto.id) {
            <z-card class="overflow-hidden flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md group">
              <!-- Imagen del Producto -->
              <div class="relative h-44 w-full bg-muted/30 border-b border-border/50 flex items-center justify-center overflow-hidden">
                <a routerLink="/inventario/productos/{{ producto.id }}" class="size-full flex items-center justify-center p-2">
                  @if (imagenMiniatura(producto); as src) {
                    <img
                      [src]="src"
                      [alt]="producto.nombre"
                      class="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                      (error)="marcarImagenRota(producto.id)"
                    />
                  } @else {
                    <ng-icon name="lucidePackage" class="size-12 text-muted-foreground/40" />
                  }
                </a>

                <!-- Badges sobre imagen -->
                <div class="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  @if (producto.tipo === 'kit') {
                    <z-badge zType="secondary" class="gap-1 text-[10px] bg-background/80 backdrop-blur">
                      <ng-icon name="lucideLayers" class="size-3" />
                      Kit
                    </z-badge>
                  }
                </div>

                <div class="absolute top-2 right-2">
                  <z-badge [zType]="producto.activo ? 'outline' : 'destructive'" class="text-[10px] bg-background/80 backdrop-blur">
                    {{ producto.activo ? 'Activo' : 'Inactivo' }}
                  </z-badge>
                </div>
              </div>

              <!-- Información del Producto -->
              <div class="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider truncate flex items-center justify-between gap-1">
                    <span class="truncate">{{ producto.categoria?.nombre || 'Sin categoría' }}</span>
                    @if (producto.marca) {
                      <span class="text-primary font-sans font-medium text-[10px] normal-case shrink-0">
                        {{ producto.marca.nombre }}
                      </span>
                    }
                  </div>

                  <a
                    routerLink="/inventario/productos/{{ producto.id }}"
                    class="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mt-0.5"
                    [title]="producto.nombre"
                  >
                    {{ producto.nombre }}
                  </a>
                  <div class="text-[11px] text-muted-foreground font-mono mt-1">
                    SKU: {{ producto.sku }}
                  </div>
                </div>

                <div class="pt-2 border-t border-border/40 space-y-1.5">
                  <div class="flex items-baseline justify-between">
                    <span class="text-base font-bold font-mono text-foreground">
                      {{ producto.precio_venta | currency }}
                    </span>
                    <span class="text-[11px] text-muted-foreground font-mono">
                      Costo {{ producto.costo | currency }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground">Disponible:</span>
                    <z-badge
                      [zType]="getTotalExistencias(producto) > 0 ? 'success' : 'danger'"
                      class="font-mono text-[11px] font-bold"
                    >
                      {{ getTotalExistencias(producto) | number }} {{ producto.unidad_medida | lowercase }}
                    </z-badge>
                  </div>
                </div>
              </div>

              <!-- Acciones del Card -->
              <div class="px-3.5 py-2 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-1">
                @if (canEditar()) {
                  <button
                    z-button
                    zType="ghost"
                    zSize="icon-sm"
                    class="text-muted-foreground hover:text-primary"
                    title="Editar"
                    (click)="editar.emit(producto)"
                  >
                    <ng-icon name="lucidePencil" class="size-3.5" />
                  </button>
                }
                @if (canCrearMovimiento()) {
                  <button
                    z-button
                    zType="ghost"
                    zSize="icon-sm"
                    class="text-muted-foreground hover:text-primary"
                    title="Agregar movimiento"
                    (click)="crearMovimiento.emit(producto)"
                  >
                    <ng-icon name="lucideActivity" class="size-3.5" />
                  </button>
                }
                @if (canEditar()) {
                  @if (producto.activo) {
                    <button
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      class="text-muted-foreground hover:text-destructive"
                      title="Desactivar"
                      (click)="desactivar.emit(producto)"
                    >
                      <ng-icon name="lucideBan" class="size-3.5" />
                    </button>
                  } @else {
                    <button
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      class="text-muted-foreground hover:text-green-600"
                      title="Activar"
                      (click)="activar.emit(producto)"
                    >
                      <ng-icon name="lucideCircleCheck" class="size-3.5" />
                    </button>
                  }
                  <button
                    z-button
                    zType="ghost"
                    zSize="icon-sm"
                    class="text-muted-foreground hover:text-destructive"
                    title="Eliminar"
                    (click)="eliminar.emit(producto)"
                  >
                    <ng-icon name="lucideTrash2" class="size-3.5" />
                  </button>
                }
              </div>
            </z-card>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoGridComponent {
  productos = input<ProductoResponse[]>([]);
  loading = input<boolean>(false);
  canEditar = input<boolean>(false);
  canCrearMovimiento = input<boolean>(false);

  desactivar = output<ProductoResponse>();
  activar = output<ProductoResponse>();
  eliminar = output<ProductoResponse>();
  editar = output<ProductoResponse>();
  crearMovimiento = output<ProductoResponse>();

  private readonly imagenesRotas = signal<Set<string>>(new Set());

  imagenMiniatura(producto: ProductoResponse): string | null {
    if (this.imagenesRotas().has(producto.id)) return null;
    const img = producto.imagen_principal;
    return img?.url ?? img?.thumbnail_url ?? null;
  }

  marcarImagenRota(id: string) {
    this.imagenesRotas.update((s) => new Set(s).add(id));
  }

  getTotalExistencias(producto: ProductoResponse): number {
    if (!producto.existencias || !producto.existencias.length) return 0;
    return producto.existencias.reduce((sum, ext) => sum + (parseFloat(ext.cantidad) || 0), 0);
  }
}
