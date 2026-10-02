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
  lucideEye,
  lucideTag,
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
      lucideEye,
      lucideTag,
    }),
  ],
  template: `
    <div class="mt-2">
      @if (loading()) {
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
          @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
            <z-card class="overflow-hidden rounded-2xl border border-border/60">
              <z-skeleton class="h-48 w-full" />
              <div class="p-4 space-y-3">
                <z-skeleton class="h-3 w-24" />
                <z-skeleton class="h-5 w-full" />
                <z-skeleton class="h-4 w-32" />
                <div class="pt-2 flex justify-between items-center border-t border-border/40">
                  <z-skeleton class="h-6 w-20" />
                  <z-skeleton class="h-6 w-16" />
                </div>
              </div>
            </z-card>
          }
        </div>
      } @else if (productos().length === 0) {
        <z-card class="p-10 rounded-2xl border border-border/60 shadow-xs">
          <z-empty
            zIcon="lucidePackage"
            zTitle="Sin productos encontrados"
            zDescription="No hay productos que coincidan con los filtros seleccionados."
            class="py-10"
          />
        </z-card>
      } @else {
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
          @for (producto of productos(); track producto.id) {
            <div
              class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
            >
              <!-- Imagen y Badges Flotantes -->
              <div class="relative h-48 w-full overflow-hidden bg-gradient-to-b from-muted/20 to-muted/40 flex items-center justify-center p-4 border-b border-border/40">
                <a routerLink="/inventario/productos/{{ producto.id }}" class="size-full flex items-center justify-center">
                  @if (imagenMiniatura(producto); as src) {
                    <img
                      [src]="src"
                      [alt]="producto.nombre"
                      class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      (error)="marcarImagenRota(producto.id)"
                    />
                  } @else {
                    <div class="flex flex-col items-center gap-1.5 text-muted-foreground/40">
                      <div class="grid size-12 place-items-center rounded-2xl bg-background/60 shadow-xs">
                        <ng-icon name="lucidePackage" class="size-6" />
                      </div>
                      <span class="text-[10px] font-medium tracking-wide">Sin imagen</span>
                    </div>
                  }
                </a>

                <!-- Badges Superiores -->
                <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center pointer-events-none">
                  @if (producto.tipo === 'kit') {
                    <z-badge zType="secondary" class="gap-1 text-[10px] font-semibold bg-background/90 backdrop-blur-md border border-border/50 shadow-xs px-2 py-0.5">
                      <ng-icon name="lucideLayers" class="size-3 text-primary" />
                      Kit
                    </z-badge>
                  } @else if (producto.tipo === 'servicio') {
                    <z-badge zType="outline" class="gap-1 text-[10px] font-semibold bg-background/90 backdrop-blur-md border border-border/50 shadow-xs px-2 py-0.5">
                      Servicio
                    </z-badge>
                  } @else if (producto.tipo === 'fraccionable') {
                    <z-badge zType="outline" class="gap-1 text-[10px] font-semibold bg-background/90 backdrop-blur-md border border-border/50 shadow-xs px-2 py-0.5">
                      Fraccionable
                    </z-badge>
                  }
                </div>

                <div class="absolute top-3 right-3 pointer-events-none">
                  <z-badge
                    [zType]="producto.activo ? 'outline' : 'destructive'"
                    class="text-[10px] font-semibold bg-background/90 backdrop-blur-md border border-border/50 shadow-xs px-2 py-0.5"
                  >
                    {{ producto.activo ? 'Activo' : 'Inactivo' }}
                  </z-badge>
                </div>
              </div>

              <!-- Cuerpo de la Card -->
              <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div class="space-y-1.5">
                  <!-- Categoría y Marca -->
                  <div class="flex items-center justify-between text-xs text-muted-foreground gap-2">
                    <span class="font-medium truncate max-w-[130px]" [title]="producto.categoria?.nombre || 'Sin categoría'">
                      {{ producto.categoria?.nombre || 'Sin categoría' }}
                    </span>
                    @if (producto.marca) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary shrink-0">
                        <ng-icon name="lucideTag" class="size-2.5" />
                        {{ producto.marca.nombre }}
                      </span>
                    }
                  </div>

                  <!-- Título -->
                  <a
                    routerLink="/inventario/productos/{{ producto.id }}"
                    class="block font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                    [title]="producto.nombre"
                  >
                    {{ producto.nombre }}
                  </a>

                  <!-- SKU y Código de barras -->
                  <div class="flex items-center gap-2 text-[11px] font-mono text-muted-foreground/80">
                    <span>SKU: {{ producto.sku }}</span>
                    @if (producto.codigo_barras) {
                      <span>·</span>
                      <span class="truncate max-w-[90px]">{{ producto.codigo_barras }}</span>
                    }
                  </div>
                </div>

                <!-- Precios y Stock -->
                <div class="pt-3 border-t border-border/50 space-y-2">
                  <div class="flex items-baseline justify-between">
                    <div>
                      <span class="text-xs text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Precio</span>
                      <span class="text-lg font-extrabold tracking-tight text-foreground font-mono">
                        {{ producto.precio_venta | currency }}
                      </span>
                    </div>
                    <div class="text-right">
                      <span class="text-xs text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Costo</span>
                      <span class="text-xs font-mono text-muted-foreground font-semibold">
                        {{ producto.costo | currency }}
                      </span>
                    </div>
                  </div>

                  <!-- Existencias / Stock status -->
                  <div class="flex items-center justify-between text-xs pt-1">
                    <span class="text-muted-foreground font-medium">Existencia:</span>
                    <z-badge
                      [zType]="getTotalExistencias(producto) > 0 ? 'success' : 'danger'"
                      class="font-mono text-[11px] font-bold px-2 py-0.5"
                    >
                      {{ getTotalExistencias(producto) | number }} {{ producto.unidad_medida | lowercase }}
                    </z-badge>
                  </div>
                </div>
              </div>

              <!-- Footer de Acciones -->
              <div class="px-4 py-2.5 bg-muted/10 border-t border-border/40 flex items-center justify-between">
                <a
                  routerLink="/inventario/productos/{{ producto.id }}"
                  z-button
                  zType="ghost"
                  zSize="xs"
                  class="text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
                >
                  <ng-icon name="lucideEye" class="size-3.5" />
                  Ver detalle
                </a>

                <div class="flex items-center gap-0.5">
                  @if (canEditar()) {
                    <button
                      z-button
                      zType="ghost"
                      zSize="icon-xs"
                      class="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Editar producto"
                      (click)="editar.emit(producto)"
                    >
                      <ng-icon name="lucidePencil" class="size-3.5" />
                    </button>
                  }
                  @if (canCrearMovimiento() && producto.tipo !== 'servicio') {
                    <button
                      z-button
                      zType="ghost"
                      zSize="icon-xs"
                      class="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Registrar movimiento de inventario"
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
                        zSize="icon-xs"
                        class="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Desactivar producto"
                        (click)="desactivar.emit(producto)"
                      >
                        <ng-icon name="lucideBan" class="size-3.5" />
                      </button>
                    } @else {
                      <button
                        z-button
                        zType="ghost"
                        zSize="icon-xs"
                        class="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        title="Activar producto"
                        (click)="activar.emit(producto)"
                      >
                        <ng-icon name="lucideCircleCheck" class="size-3.5" />
                      </button>
                    }
                    <button
                      z-button
                      zType="ghost"
                      zSize="icon-xs"
                      class="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Eliminar producto"
                      (click)="eliminar.emit(producto)"
                    >
                      <ng-icon name="lucideTrash2" class="size-3.5" />
                    </button>
                  }
                </div>
              </div>
            </div>
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
