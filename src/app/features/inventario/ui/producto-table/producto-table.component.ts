import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash, lucideCircleCheck, lucideX, lucideActivity } from '@ng-icons/lucide';
import { ProductoResponse } from '../../data-access/inventario.models';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardPaginationImports } from '../../../../shared/components/pagination/pagination.imports';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardHoverCardDirective, ZardHoverCardComponent } from '../../../../shared/components/hover/hover-card.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-producto-table',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    DecimalPipe,
    LowerCasePipe,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...ZardSelectImports,
    ZardHoverCardDirective,
    ZardHoverCardComponent,
    ZardCheckboxComponent,
    ZardButtonComponent,
    ZardBadgeComponent
  ],
  viewProviders: [
    provideIcons({ lucidePencil, lucideTrash, lucideCircleCheck, lucideX, lucideActivity })
  ],
  templateUrl: './producto-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoTableComponent {
  productos = input<ProductoResponse[]>([]);
  loading = input<boolean>(false);
  selectedIds = input<Set<string>>(new Set());
  allSelected = input<boolean>(false);
  sort = input<string>('');
  canEditar = input<boolean>(false);
  canCrearMovimiento = input<boolean>(false);
  totalItems = input<number>(0);
  totalPages = input<number>(0);
  page = input<number>(1);
  pageSize = input<number>(10);

  sortChange = output<string>();
  pageChange = output<number>();
  pageSizeChange = output<string>();
  toggleSelection = output<{id: string, checked: boolean}>();
  toggleAll = output<boolean>();
  desactivar = output<ProductoResponse>();
  activar = output<ProductoResponse>();
  editar = output<ProductoResponse>();
  crearMovimiento = output<ProductoResponse>();

  public sucursalService = inject(SucursalService);

  getSucursalNombre(id: string): string {
    const sucursal = this.sucursalService.sucursales().find(s => s.id === id);
    return sucursal ? sucursal.nombre : 'Desconocida';
  }

  getSortIcon(field: string): string {
    const current = this.sort();
    if (!current.startsWith(field)) return '';
    return current.endsWith(':asc') ? '↑' : '↓';
  }

  getTotalExistencias(producto: ProductoResponse): number {
    if (!producto.existencias || !producto.existencias.length) return 0;
    return producto.existencias.reduce((sum, ext) => sum + (parseFloat(ext.cantidad) || 0), 0);
  }

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const window = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      window.push(i);
    }
    
    return window;
  });

  goToPrevious() {
    if (this.page() > 1) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  goToNext() {
    if (this.page() < this.totalPages()) {
      this.pageChange.emit(this.page() + 1);
    }
  }

  goToPage(p: number) {
    this.pageChange.emit(p);
  }
}
