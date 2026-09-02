import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash } from '@ng-icons/lucide';
import { ProductoResponse } from '../../data-access/inventario.models';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-producto-table',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    DecimalPipe,
    ...ZardTableImports,
    ZardCheckboxComponent,
    ZardButtonComponent
  ],
  viewProviders: [
    provideIcons({ lucidePencil, lucideTrash })
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

  

  sortChange = output<string>();
  toggleSelection = output<{id: string, checked: boolean}>();
  toggleAll = output<boolean>();
  desactivar = output<ProductoResponse>();

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
