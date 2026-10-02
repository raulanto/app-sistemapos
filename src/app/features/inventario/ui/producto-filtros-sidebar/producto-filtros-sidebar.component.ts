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
    <z-card class="p-4 space-y-5 bg-card border border-border/60 shadow-xs rounded-2xl sticky top-4 text-xs">
      <!-- Encabezado Sidebar -->
      <div class="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 class="font-extrabold text-xs tracking-tight flex items-center gap-2 text-foreground">
          <div class="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary">
            <ng-icon name="lucideSlidersHorizontal" class="size-3.5" />
          </div>
          Filtros
        </h3>
        @if (hayFiltrosActivos()) {
          <button
            z-button
            zType="ghost"
            zSize="xs"
            class="text-[11px] font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md px-1.5 py-0.5"
            (click)="limpiarFiltros()"
          >
            Limpiar todo
          </button>
        }
      </div>

      <!-- Búsqueda General -->
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Buscar</label>
        <z-input-group class="w-full">
          <z-input-group-addon>
            <ng-icon name="lucideSearch" class="size-3.5 text-muted-foreground" />
          </z-input-group-addon>
          <input
            z-input
            type="text"
            placeholder="Nombre, SKU..."
            [ngModel]="q()"
            (ngModelChange)="qChange.emit($event)"
            class="text-xs h-8"
          />
          @if (q()) {
            <z-input-group-addon zAlign="inline-end">
              <button z-input-group-button zSize="icon-xs" (click)="qChange.emit('')" aria-label="Limpiar búsqueda">
                <ng-icon name="lucideX" class="size-3" />
              </button>
            </z-input-group-addon>
          }
        </z-input-group>
      </div>

      <!-- Categorías -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Categorías</label>
          @if (categoriaId().length > 0) {
            <span class="inline-flex items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-primary">
              {{ categoriaId().length }}
            </span>
          }
        </div>

        <div class="max-h-44 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
          @for (cat of categoriasVisibles(); track cat.id) {
            <label
              class="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-pointer hover:bg-muted/60"
              [class.bg-muted/40]="isCategoriaSelected(cat.id)"
            >
              <z-checkbox
                [zId]="'cat-' + cat.id"
                [ngModel]="isCategoriaSelected(cat.id)"
                (ngModelChange)="toggleCategoria(cat.id, $event)"
              />
              <span class="text-xs font-medium text-foreground select-none flex-1 truncate">{{ cat.nombre }}</span>
            </label>
          }
        </div>

        @if (categorias().length > 8) {
          <button
            type="button"
            class="text-[11px] text-primary font-semibold hover:underline pt-0.5 flex items-center gap-1"
            (click)="mostrarTodasCategorias.update(v => !v)"
          >
            <ng-icon name="lucideChevronDown" class="size-3 transition-transform" [class.rotate-180]="mostrarTodasCategorias()" />
            {{ mostrarTodasCategorias() ? 'Ver menos' : 'Ver todas (' + categorias().length + ')' }}
          </button>
        }
      </div>

      <!-- Marcas -->
      @if (marcas().length > 0) {
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Marcas</label>
            @if (marcaId().length > 0) {
              <span class="inline-flex items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-primary">
                {{ marcaId().length }}
              </span>
            }
          </div>

          <div class="max-h-44 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
            @for (m of marcasVisibles(); track m.id) {
              <label
                class="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-pointer hover:bg-muted/60"
                [class.bg-muted/40]="isMarcaSelected(m.id)"
              >
                <z-checkbox
                  [zId]="'marca-' + m.id"
                  [ngModel]="isMarcaSelected(m.id)"
                  (ngModelChange)="toggleMarca(m.id, $event)"
                />
                <span class="text-xs font-medium text-foreground select-none flex-1 truncate">{{ m.nombre }}</span>
              </label>
            }
          </div>

          @if (marcas().length > 8) {
            <button
              type="button"
              class="text-[11px] text-primary font-semibold hover:underline pt-0.5 flex items-center gap-1"
              (click)="mostrarTodasMarcas.update(v => !v)"
            >
              <ng-icon name="lucideChevronDown" class="size-3 transition-transform" [class.rotate-180]="mostrarTodasMarcas()" />
              {{ mostrarTodasMarcas() ? 'Ver menos' : 'Ver todas (' + marcas().length + ')' }}
            </button>
          }
        </div>
      }

      <!-- Tipo de Producto -->
      <div class="space-y-2">
        <label class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Tipo de Producto</label>
        <div class="space-y-0.5">
          @for (t of tiposDisponibles; track t.value) {
            <label
              class="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-pointer hover:bg-muted/60"
              [class.bg-muted/40]="isTipoSelected(t.value)"
            >
              <z-checkbox
                [zId]="'tipo-' + t.value"
                [ngModel]="isTipoSelected(t.value)"
                (ngModelChange)="toggleTipo(t.value, $event)"
              />
              <span class="text-xs font-medium text-foreground select-none flex-1 truncate">{{ t.label }}</span>
            </label>
          }
        </div>
      </div>

      <!-- Alcance de Sucursales -->
      <div class="pt-2.5 border-t border-border/60">
        <div class="flex items-center justify-between gap-2">
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
