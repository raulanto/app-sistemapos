import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, switchMap, tap, map } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrendingUp, lucideTrendingDown, lucideMinus, lucideAlertCircle } from '@ng-icons/lucide';
import { ProductoService } from '../data-access/producto.service';
import { CategoriaService } from '../data-access/categoria.service';
import { CategoriaResponse, ProductoQuery, ProductoResponse, ProductoKpiResponse } from '../data-access/inventario.models';
import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';
import { SucursalService } from '@/core/sucursal/sucursal.service';
import { ProductoFiltrosComponent } from '../ui/producto-filtros/producto-filtros.component';
import { ProductoTableComponent } from '../ui/producto-table/producto-table.component';
import { ProductoFormSheetComponent } from '../ui/producto-form-sheet/producto-form-sheet.component';
import { MovimientoFormSheetComponent } from '../ui/movimiento-form-sheet/movimiento-form-sheet.component';
import { InventarioActionService } from '../data-access/inventario-action.service';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgIcon, 
    ...ZardCardImports, 
    ZardButtonComponent,
    ZardBadgeComponent,
    ...ZardSelectImports,
    ...ZardPaginationImports,
    ProductoFiltrosComponent,
    ProductoTableComponent
  ],
  viewProviders: [
    provideIcons({ lucidePlus, lucideTrendingUp, lucideTrendingDown, lucideMinus, lucideAlertCircle })
  ],
  templateUrl: './producto-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly authService = inject(AuthService);
  private readonly sucursalService = inject(SucursalService);
  private readonly inventarioAction = inject(InventarioActionService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));
  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.inventario.editar));

  readonly productos = signal<ProductoResponse[]>([]);
  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly loading = signal(false);
  readonly kpis = signal<ProductoKpiResponse | null>(null);

  // Filtros y Paginación
  readonly q = signal<string>('');
  readonly categoriaId = signal<string[]>([]);
  readonly activo = signal<string[]>([]);
  readonly todasLasSucursales = signal(this.authService.currentUser()?.rol?.codigo === 'admin');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sort = signal<string>('created_at:desc');
  readonly selectedIds = signal<Set<string>>(new Set());
  
  // Metadatos
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly refreshTrigger = signal(0);
  readonly allSelected = computed(() => {
    const p = this.productos();
    return p.length > 0 && p.every(prod => this.selectedIds().has(prod.id));
  });

  private readonly query = computed<ProductoQuery>(() => {
    // Depend on refreshTrigger to force re-fetch
    this.refreshTrigger();

    let activoVal: boolean | null = null;
    if (this.activo().length === 1) {
      activoVal = this.activo()[0] === 'true';
    }

    const currentSucursalId = this.sucursalService.selectedSucursalId();
    const sucursal_id = this.todasLasSucursales() || !currentSucursalId ? null : [currentSucursalId];

    return {
      q: this.q() || null,
      categoria_id: this.categoriaId().length > 0 ? this.categoriaId() : null,
      activo: activoVal,
      sucursal_id,
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
      switchMap(query => {
        return this.productoService.listar(query).pipe(
          switchMap(res => {
            return this.productoService.obtenerKpis(query).pipe(
              tap(kpiRes => this.kpis.set(kpiRes)),
              map(() => res)
            );
          })
        );
      })
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

  readonly cards = computed(() => {
    const kpi = this.kpis();
    if (!kpi) return [];

    const formatCurrency = (val: string | null) => {
      const num = Number(val || 0);
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    };

    const formatNum = (val: string | number | null) => {
      const num = Number(val || 0);
      return new Intl.NumberFormat('es-MX').format(num);
    };

    const totalActivos = kpi.activos;
    const itemsBajoStock = kpi.bajo_stock;
    const unidades = formatNum(kpi.unidades_en_stock);
    const margen = formatCurrency(kpi.margen_promedio);
    const valorVenta = formatCurrency(kpi.valor_inventario_venta);
    const valorCosto = formatCurrency(kpi.valor_inventario_costo);

    return [
      {
        description: 'Productos Activos',
        value: totalActivos.toString(),
        trend: 'neutral',
        badge: `${kpi.inactivos} inactivos`,
        headline: 'Catálogo',
        caption: `${kpi.categorias_distintas} categorías activas`
      },
      {
        description: 'Unidades en Stock',
        value: unidades,
        trend: itemsBajoStock > 0 ? 'down' : 'up',
        badge: `${itemsBajoStock} bajo stock`,
        headline: 'Disponibilidad',
        caption: `En ${kpi.productos_con_existencia} productos`
      },
      {
        description: 'Valor del Inventario (Costo)',
        value: valorCosto,
        trend: 'neutral',
        badge: `Costo prom. ${formatCurrency(kpi.costo_promedio)}`,
        headline: 'Inversión',
        caption: 'Costo total del stock'
      },
      {
        description: 'Valor del Inventario (Venta)',
        value: valorVenta,
        trend: 'up',
        badge: `Margen prom. ${margen}`,
        headline: 'Proyección',
        caption: 'Valor potencial de venta'
      }
    ];
  });

  trendIcon(trend: string) {
    if (trend === 'up') return 'lucideTrendingUp';
    if (trend === 'down') return 'lucideTrendingDown';
    if (trend === 'alert') return 'lucideAlertCircle';
    return 'lucideMinus';
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

  updateActivo(activo: string[]) {
    this.activo.set(activo);
    this.page.set(1);
  }

  updateTodasLasSucursales(val: boolean) {
    this.todasLasSucursales.set(val);
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
        this.inventarioAction.handleAction(
          this.productoService.desactivar(producto.id),
          'Producto desactivado correctamente',
          'Error al desactivar el producto',
          () => this.refreshTrigger.update(v => v + 1)
        );
      }
    });
  }

  activar(producto: ProductoResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Activar producto ${producto.sku}?`,
      zDescription: 'Esta acción cambiará el estado del producto a activo.',
      zOkText: 'Activar',
      zOkDestructive: false,
      zOnOk: () => {
        this.inventarioAction.handleAction(
          this.productoService.activar(producto.id),
          'Producto activado correctamente',
          'Error al activar el producto',
          () => this.refreshTrigger.update(v => v + 1)
        );
      }
    });
  }

  openEditSheet(prod: ProductoResponse) {
    this.sheetService.create({
      zTitle: `Editar ${prod.sku}`,
      zDescription: 'Modifica los datos del producto.',
      zContent: ProductoFormSheetComponent,
      zData: { 
        productoId: prod.id,
        onSaved: () => {
          this.sonner.success('Producto actualizado exitosamente');
          this.refreshTrigger.update(v => v + 1);
        }
      },
      zHideFooter: true
    });
  }

  openMovimientoSheet(prod: ProductoResponse) {
    this.sheetService.create({
      zTitle: 'Agregar Movimiento',
      zDescription: `Registrar movimiento manual para ${prod.sku}.`,
      zContent: MovimientoFormSheetComponent,
      zData: { productoId: prod.id },
      zOkText: 'Aplicar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Movimiento registrado exitosamente',
          'Error al registrar el movimiento',
          () => this.refreshTrigger.update(v => v + 1)
        );
      }
    });
  }
}
