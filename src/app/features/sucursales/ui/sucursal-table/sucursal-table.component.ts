import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePencil,
  lucideBan,
  lucideCircleCheck,
  lucideMapPin,
  lucidePhone,
  lucideChevronsUpDown,
  lucideChevronUp,
  lucideChevronDown,
  lucideX,
} from '@ng-icons/lucide';

import { SucursalResponse } from '../../data-access/sucursal.models';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardPaginationImports } from '../../../../shared/components/pagination/pagination.imports';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardSkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';

@Component({
  selector: 'app-sucursal-table',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgIconComponent,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardSkeletonComponent,
    ZardEmptyComponent,
  ],
  templateUrl: './sucursal-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucidePencil,
      lucideBan,
      lucideCircleCheck,
      lucideMapPin,
      lucidePhone,
      lucideChevronsUpDown,
      lucideChevronUp,
      lucideChevronDown,
      lucideX,
    }),
  ],
})
export class SucursalTableComponent {
  sucursales = input<SucursalResponse[]>([]);
  loading = input<boolean>(false);
  sort = input<string>('nombre:asc');
  canEditar = input<boolean>(true);
  totalItems = input<number>(0);
  totalPages = input<number>(0);
  page = input<number>(1);
  pageSize = input<number>(10);

  sortChange = output<string>();
  pageChange = output<number>();
  pageSizeChange = output<string>();
  editar = output<SucursalResponse>();
  desactivar = output<SucursalResponse>();
  activar = output<SucursalResponse>();

  sortState(field: string): 'asc' | 'desc' | 'none' {
    const current = this.sort();
    if (!current.startsWith(field)) return 'none';
    return current.endsWith(':asc') ? 'asc' : 'desc';
  }

  sortIconName(field: string): string {
    const state = this.sortState(field);
    if (state === 'asc') return 'lucideChevronUp';
    if (state === 'desc') return 'lucideChevronDown';
    return 'lucideChevronsUpDown';
  }

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    const window: number[] = [];
    for (let i = start; i <= end; i++) {
      window.push(i);
    }
    return window;
  });

  goToPrevious() {
    if (this.page() > 1) this.pageChange.emit(this.page() - 1);
  }

  goToNext() {
    if (this.page() < this.totalPages()) this.pageChange.emit(this.page() + 1);
  }

  goToPage(p: number) {
    this.pageChange.emit(p);
  }
}
