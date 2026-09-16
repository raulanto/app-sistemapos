import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ZardSelectImports } from '@/shared/components/select/select.imports';
import { ZardPaginationImports } from '@/shared/components/pagination/pagination.imports';

@Component({
  selector: 'app-reporte-paginacion',
  standalone: true,
  imports: [FormsModule, ...ZardSelectImports, ...ZardPaginationImports],
  templateUrl: './reporte-paginacion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportePaginacionComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly etiqueta = input('resultado(s)');

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  /** Ventana de páginas visibles (máx. 5) alrededor de la actual. */
  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const w: number[] = [];
    for (let i = start; i <= end; i++) w.push(i);
    return w;
  });

  irA(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.pageChange.emit(p);
  }
  prev() {
    this.irA(this.page() - 1);
  }
  next() {
    this.irA(this.page() + 1);
  }
  setPageSize(v: string) {
    this.pageSizeChange.emit(Number(v) || 20);
  }
}
