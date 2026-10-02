import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX, lucideFilterX, lucideChevronDown, lucideSlidersHorizontal } from '@ng-icons/lucide';

import { CategoriaResponse, MarcaResponse } from '../../data-access/inventario.models';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardInputGroupImports } from '../../../../shared/components/input-group/input-group.imports';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardSwitchComponent } from '../../../../shared/components/switch/switch.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardSliderComponent } from '../../../../shared/components/slider/slider.component';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';

@Component({
  selector: 'app-producto-filtros-sidebar',
  standalone: true,
  imports: [
    FormsModule,
    NgIconComponent,
    ZardInputComponent,
    ...ZardInputGroupImports,
    ZardCheckboxComponent,
    ZardSwitchComponent,
    ZardButtonComponent,
    ...ZardSelectImports,
    ...ZardCardImports,
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideX,
      lucideFilterX,
      lucideChevronDown,
      lucideSlidersHorizontal,
    }),
  ],
  template: `
    <z-card class="p-4 space-y-6 bg-card border border-border shadow-xs">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h3 class="font-bold text-base flex items-center gap-2 text-foreground">
          <ng-icon name="lucideSlidersHorizontal" class="size-4 text-primary" />
          Filtros
        </h3>
        @if (hayFiltrosActivos()) {
          <button
            z-button
            zType="ghost"
            zSize="xs"
            class="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            (click)="limpiarFiltros()"
          >
            Limpiar todo
          </button>
        }
      </div>

      <!-- Búsqueda General -->
      <div class="space-y-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buscar</label>
        <z-input-group class="w-full">
          <z-input-group-addon>
            <ng-icon name="lucideSearch" class="size-4" />
          </z-input-group-addon>
          <input
            z-input
            type="text"
            placeholder="Nombre, SKU o código..."
            [ngModel]="q()"
            (ngModelChange)="qChange.emit($event)"
          />
          @if (q()) {
            <z-input-group-addon zAlign="inline-end">
              <button z-input-group-button zSize="icon-xs" (click)="qChange.emit('')" aria-label="Limpiar búsqueda">
                <ng-icon name="lucideX" />
              </button>
            </z-input-group-addon>
          }
        </z-input-group>
      </div>

      <!-- Lista de Categorías con Checkboxes -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categorías</label>
          @if (categoriaId().length > 0) {
            <span class="text-[11px] font-mono text-primary font-medium">({{ categoriaId().length }})</span>
          }
        </div>

        <div class="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          @for (cat of categoriasVisibles(); track cat.id) {
            <z-checkbox
              [zId]="'cat-' + cat.id"
              [ngModel]="isCategoriaSelected(cat.id)"
              (ngModelChange)="toggleCategoria(cat.id, $event)"
              class="text-xs font-normal text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {{ cat.nombre }}
            </z-checkbox>
          }
        </div>

        @if (categorias().length > 8) {
          <button
            type="button"
            class="text-xs text-primary font-medium hover:underline pt-1"
            (click)="mostrarTodasCategorias.update(v => !v)"
          >
            {{ mostrarTodasCategorias() ? 'Ver menos' : 'Ver todas (' + categorias().length + ')' }}
          </button>
        }
      </div>

      <!-- Lista de Marcas con Checkboxes -->
      @if (marcas().length > 0) {
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marcas</label>
            @if (marcaId().length > 0) {
              <span class="text-[11px] font-mono text-primary font-medium">({{ marcaId().length }})</span>
            }
          </div>

          <div class="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            @for (m of marcasVisibles(); track m.id) {
              <z-checkbox
                [zId]="'marca-' + m.id"
                [ngModel]="isMarcaSelected(m.id)"
                (ngModelChange)="toggleMarca(m.id, $event)"
                class="text-xs font-normal text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {{ m.nombre }}
              </z-checkbox>
            }
          </div>

          @if (marcas().length > 8) {
            <button
              type="button"
              class="text-xs text-primary font-medium hover:underline pt-1"
              (click)="mostrarTodasMarcas.update(v => !v)"
            >
              {{ mostrarTodasMarcas() ? 'Ver menos' : 'Ver todas (' + marcas().length + ')' }}
            </button>
          }
        </div>
      }

      <!-- Tipo de Producto -->
      <div class="space-y-2">
        <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Producto</label>
        <div class="space-y-1.5">
          @for (t of tiposDisponibles; track t.value) {
            <z-checkbox
              [zId]="'tipo-' + t.value"
              [ngModel]="isTipoSelected(t.value)"
              (ngModelChange)="toggleTipo(t.value, $event)"
              class="text-xs font-normal text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {{ t.label }}
            </z-checkbox>
          }
        </div>
      </div>

      <!-- Alcance de Sucursales -->
      <div class="pt-2 border-t border-border/60">
        <div class="flex items-center justify-between">
          <label for="todasSucursalesSide" class="text-xs font-medium text-foreground cursor-pointer select-none">
            Todas las sucursales
          </label>
          <z-switch
            zId="todasSucursalesSide"
            [ngModel]="todasLasSucursales()"
            (ngModelChange)="todasLasSucursalesChange.emit($event)"
          />
        </div>
      </div>
    </z-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoFiltrosSidebarComponent {
  q = input<string>('');
  categorias = input<CategoriaResponse[]>([]);
  categoriaId = input<string[]>([]);
  marcas = input<MarcaResponse[]>([]);
  marcaId = input<string[]>([]);
  tipo = input<string[]>([]);
  activo = input<string[]>([]);
  todasLasSucursales = input<boolean>(false);

  qChange = output<string>();
  categoriaIdChange = output<string[]>();
  marcaIdChange = output<string[]>();
  tipoChange = output<string[]>();
  activoChange = output<string[]>();
  todasLasSucursalesChange = output<boolean>();

  readonly mostrarTodasCategorias = signal(false);
  readonly mostrarTodasMarcas = signal(false);

  readonly tiposDisponibles = [
    { value: 'simple', label: 'Simple' },
    { value: 'fraccionable', label: 'Fraccionable' },
    { value: 'kit', label: 'Kit' },
    { value: 'servicio', label: 'Servicio' },
  ];

  readonly categoriasVisibles = computed(() => {
    const list = this.categorias();
    if (this.mostrarTodasCategorias()) return list;
    return list.slice(0, 8);
  });

  readonly marcasVisibles = computed(() => {
    const list = this.marcas();
    if (this.mostrarTodasMarcas()) return list;
    return list.slice(0, 8);
  });

  readonly hayFiltrosActivos = computed(
    () =>
      !!this.q() ||
      this.categoriaId().length > 0 ||
      this.marcaId().length > 0 ||
      this.tipo().length > 0 ||
      this.activo().length > 0,
  );

  isCategoriaSelected(id: string): boolean {
    return this.categoriaId().includes(id);
  }

  toggleCategoria(id: string, checked: boolean): void {
    const current = new Set(this.categoriaId());
    if (checked) current.add(id);
    else current.delete(id);
    this.categoriaIdChange.emit(Array.from(current));
  }

  isMarcaSelected(id: string): boolean {
    return this.marcaId().includes(id);
  }

  toggleMarca(id: string, checked: boolean): void {
    const current = new Set(this.marcaId());
    if (checked) current.add(id);
    else current.delete(id);
    this.marcaIdChange.emit(Array.from(current));
  }

  isTipoSelected(value: string): boolean {
    return this.tipo().includes(value);
  }

  toggleTipo(value: string, checked: boolean): void {
    const current = new Set(this.tipo());
    if (checked) current.add(value);
    else current.delete(value);
    this.tipoChange.emit(Array.from(current));
  }

  limpiarFiltros(): void {
    this.qChange.emit('');
    this.categoriaIdChange.emit([]);
    this.marcaIdChange.emit([]);
    this.tipoChange.emit([]);
    this.activoChange.emit([]);
  }
}
