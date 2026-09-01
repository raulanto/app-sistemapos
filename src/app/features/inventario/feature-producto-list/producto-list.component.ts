import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucidePencil, lucideTrash, lucideMoreHorizontal, lucideGripVertical } from '@ng-icons/lucide';

import { ProductoService } from '../data-access/producto.service';
import { CategoriaService } from '../data-access/categoria.service';
import { ProductoResponse, CategoriaResponse, ProductoQuery } from '../data-access/inventario.models';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardCheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { ZardDropdownImports } from '../../../shared/components/dropdown/dropdown.imports';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    RouterLink, 
    FormsModule,
    NgIcon, 
    ...ZardTableImports, 
    ...ZardCardImports, 
    ZardButtonComponent,
    ZardInputComponent,
    ...ZardSelectImports,
    ...ZardPaginationImports,
    ZardCheckboxComponent,
    ...ZardDropdownImports
  ],
  viewProviders: [
    provideIcons({ lucidePlus, lucidePencil, lucideTrash, lucideMoreHorizontal, lucideGripVertical })
  ],
  template: `
    <div class="p-6 w-full space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Productos</h1>
          <p class="text-muted-foreground">Gestiona el catálogo de productos y precios.</p>
        </div>
        <a routerLink="nuevo" z-button zType="default">
          <ng-icon name="lucidePlus" class="mr-2" /> Nuevo Producto
        </a>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <input z-input type="text" placeholder="Buscar por SKU, Nombre..." class="w-full sm:max-w-xs"
               [ngModel]="q()" (ngModelChange)="updateSearch($event)" />
        
        <z-select [zMultiple]="true" [ngModel]="categoriaId()" (ngModelChange)="updateCategoria($event)" placeholder="Categoría">
          @for (c of categorias(); track c.id) {
            <z-select-item [zValue]="c.id">{{ c.nombre }}</z-select-item>
          }
        </z-select>

        <z-select [zMultiple]="true" [ngModel]="activo()" (ngModelChange)="updateActivo($event)" placeholder="Estado">
          <z-select-item [zValue]="'true'">Activos</z-select-item>
          <z-select-item [zValue]="'false'">Inactivos</z-select-item>
        </z-select>
      </div>

      <div z-card>
        <z-card-content class="p-0">
          <table z-table>
            <thead z-table-header>
              <tr z-table-row>
                <th z-table-head class="w-12"><z-checkbox (ngModelChange)="toggleAll($event)" [ngModel]="allSelected()"></z-checkbox></th>
                <th z-table-head class="w-12"></th>
                <th z-table-head (click)="toggleSort('sku')" class="cursor-pointer hover:bg-muted/50 select-none">
                  SKU / Código {{ getSortIcon('sku') }}
                </th>
                <th z-table-head (click)="toggleSort('nombre')" class="cursor-pointer hover:bg-muted/50 select-none">
                  Nombre {{ getSortIcon('nombre') }}
                </th>
                <th z-table-head>Categoría</th>
                <th z-table-head (click)="toggleSort('precio_venta')" class="cursor-pointer hover:bg-muted/50 select-none">
                  Precio (Costo) {{ getSortIcon('precio_venta') }}
                </th>
                <th z-table-head>Stock</th>
                <th z-table-head class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @if (loading()) {
                <tr z-table-row>
                  <td z-table-cell colspan="8" class="h-24 text-center text-muted-foreground">
                    Cargando productos...
                  </td>
                </tr>
              } @else {
                @for (producto of productos(); track producto.id) {
                  <tr z-table-row>
                    <td z-table-cell><z-checkbox [ngModel]="selectedIds().has(producto.id)" (ngModelChange)="toggleSelection(producto.id, $event)"></z-checkbox></td>
                    <td z-table-cell><ng-icon name="lucideGripVertical" class="text-muted-foreground/50 size-4" /></td>
                    <td z-table-cell>
                      <div class="font-medium">{{ producto.sku }}</div>
                      <div class="text-xs text-muted-foreground">{{ producto.codigo_barras || '-' }}</div>
                    </td>
                    <td z-table-cell>
                      <div class="font-medium">{{ producto.nombre }}</div>
                      <div class="text-xs text-muted-foreground truncate max-w-[200px]" [title]="producto.descripcion || ''">
                        {{ producto.descripcion || 'Sin descripción' }}
                      </div>
                    </td>
                    <td z-table-cell>{{ producto.categoria?.nombre || 'Sin Categoría' }}</td>
                    <td z-table-cell>
                      <div class="font-medium">\${{ producto.precio_venta }}</div>
                      <div class="text-xs text-muted-foreground">Costo: \${{ producto.costo }}</div>
                    </td>
                    <td z-table-cell>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [class.bg-secondary]="producto.activo"
                            [class.text-secondary-foreground]="producto.activo"
                            [class.bg-destructive]="!producto.activo"
                            [class.text-destructive-foreground]="!producto.activo">
                        {{ producto.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td z-table-cell class="text-right space-x-2">
                      <a [routerLink]="['/inventario/productos', producto.id]" z-button zType="ghost" zSize="icon" class="text-muted-foreground hover:text-primary h-8 w-8" title="Editar">
                        <ng-icon name="lucidePencil" class="size-4" />
                      </a>
                      <button z-button zType="ghost" zSize="icon" class="text-muted-foreground hover:text-destructive h-8 w-8" title="Desactivar" (click)="desactivar(producto)">
                        <ng-icon name="lucideTrash" class="size-4" />
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr z-table-row>
                    <td z-table-cell colspan="8" class="h-24 text-center text-muted-foreground">
                      No se encontraron resultados
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </z-card-content>
        
        <!-- Paginación -->
        @if (totalItems() > 0) {
          <div class="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-sm text-muted-foreground">
              {{ selectedIds().size }} de {{ totalItems() }} fila(s) seleccionada(s).
            </div>
            
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">Filas por página</span>
                <z-select [ngModel]="pageSize().toString()" (ngModelChange)="updatePageSize($event)">
                  <z-select-item [zValue]="'10'">10</z-select-item>
                  <z-select-item [zValue]="'20'">20</z-select-item>
                  <z-select-item [zValue]="'50'">50</z-select-item>
                </z-select>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium mr-4">Página {{ page() }} de {{ totalPages() }}</span>
                <z-pagination 
                  [zTotal]="totalPages()" 
                  [zPageIndex]="page()" 
                  (zPageIndexChange)="page.set($event)">
                </z-pagination>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);

  readonly productos = signal<ProductoResponse[]>([]);
  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly loading = signal(false);

  // Filtros y Paginación
  readonly q = signal<string>('');
  readonly categoriaId = signal<string[]>([]);
  readonly activo = signal<string[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sort = signal<string>('created_at:desc');
  readonly selectedIds = signal<Set<string>>(new Set());
  
  // Metadatos
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly allSelected = computed(() => {
    const p = this.productos();
    return p.length > 0 && p.every(prod => this.selectedIds().has(prod.id));
  });

  private readonly query = computed<ProductoQuery>(() => {
    let activoVal: boolean | null = null;
    if (this.activo().length === 1) {
      activoVal = this.activo()[0] === 'true';
    }

    return {
      q: this.q() || null,
      categoria_id: this.categoriaId().length > 0 ? this.categoriaId() : null,
      activo: activoVal,
      page: this.page(),
      page_size: this.pageSize(),
      sort: this.sort(),
      include: 'categoria'
    };
  });

  constructor() {
    toObservable(this.query).pipe(
      tap(() => this.loading.set(true)),
      debounceTime(300),
      switchMap(query => this.productoService.listar(query))
    ).subscribe({
      next: (res) => {
        this.productos.set(res.data);
        if (res.meta?.pagination) {
          this.totalItems.set(res.meta.pagination.total_items);
          this.totalPages.set(res.meta.pagination.total_pages);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
      }
    });
  }

  ngOnInit() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al cargar categorias:', err)
    });
  }

  updateSearch(val: string) {
    this.q.set(val);
    this.page.set(1);
  }

  updatePageSize(val: string) {
    this.pageSize.set(parseInt(val, 10));
    this.page.set(1);
  }

  updateCategoria(val: string[]) {
    this.categoriaId.set(val);
    this.page.set(1);
  }

  updateActivo(val: string[]) {
    this.activo.set(val);
    this.page.set(1);
  }

  toggleSelection(id: string, checked: boolean) {
    this.selectedIds.update(set => {
      const newSet = new Set(set);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  }

  toggleAll(checked: boolean) {
    if (checked) {
      const allIds = this.productos().map(p => p.id);
      this.selectedIds.set(new Set(allIds));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  toggleSort(field: string) {
    const current = this.sort();
    if (current.startsWith(field)) {
      const isAsc = current.endsWith(':asc');
      this.sort.set(`${field}:${isAsc ? 'desc' : 'asc'}`);
    } else {
      this.sort.set(`${field}:asc`);
    }
    this.page.set(1);
  }

  getSortIcon(field: string): string {
    const current = this.sort();
    if (!current.startsWith(field)) return '';
    return current.endsWith(':asc') ? '↑' : '↓';
  }

  desactivar(producto: ProductoResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar producto ${producto.sku}?`,
      zDescription: 'Esta acción cambiará el estado del producto a inactivo.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.productoService.desactivar(producto.id).subscribe({
          next: () => {
            this.sonner.success('Producto desactivado correctamente');
            this.page.set(this.page()); // Force refresh of the same page
          },
          error: (err) => {
            this.sonner.error('Error al desactivar el producto');
            console.error('Error desactivando:', err);
          }
        });
      }
    });
  }
}
