import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash, lucideCircleCheck, lucideX } from '@ng-icons/lucide';
import { ProductoResponse } from '../../data-access/inventario.models';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardPaginationImports } from '../../../../shared/components/pagination/pagination.imports';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '@/shared/components/badge';
@Component({
  selector: 'app-producto-table',
  standalone: true,
  imports: [
    FormsModule,
    NgIcon,
    DecimalPipe,
    LowerCasePipe,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...ZardSelectImports,
    ZardCheckboxComponent,
    ZardButtonComponent,
    ZardBadgeComponent
  ],
  viewProviders: [
    provideIcons({ lucidePencil, lucideTrash, lucideCircleCheck, lucideX })
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
  editar = output<ProductoResponse>();

  getSortIcon(field: string): string {
    const current = this.sort();
    if (!current.startsWith(field)) return '';
    return current.endsWith(':asc') ? '↑' : '↓';
  }

  getTotalExistencias(producto: ProductoResponse): number {
    if (!producto.existencias || !producto.existencias.length) return 0;
    return producto.existencias.reduce((sum, ext) => sum + (parseFloat(ext.cantidad) || 0), 0);
  }
}
