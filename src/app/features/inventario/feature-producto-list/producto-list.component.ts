import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { ProductoService } from '../data-access/producto.service';
import { CategoriaService } from '../data-access/categoria.service';
import { CategoriaResponse, ProductoQuery, ProductoResponse } from '../data-access/inventario.models';
import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';
import { ProductoFiltrosComponent } from '../ui/producto-filtros/producto-filtros.component';
import { ProductoTableComponent } from '../ui/producto-table/producto-table.component';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    RouterLink, 
    FormsModule,
    NgIcon, 
    ...ZardCardImports, 
    ZardButtonComponent,
    ...ZardSelectImports,
    ...ZardPaginationImports,
    ProductoFiltrosComponent,
    ProductoTableComponent
  ],
  viewProviders: [
    provideIcons({ lucidePlus })
  ],
  templateUrl: './producto-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly authService = inject(AuthService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));
  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.inventario.editar));

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
      include: ['categoria', 'existencias']
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
