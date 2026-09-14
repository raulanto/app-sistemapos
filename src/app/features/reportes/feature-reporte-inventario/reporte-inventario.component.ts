import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { provideIcons } from '@ng-icons/core';
import { lucideBoxes } from '@ng-icons/lucide';

import { CategoriaService } from '@/features/inventario/data-access/categoria.service';
import { CategoriaResponse } from '@/features/inventario/data-access/models/categoria.model';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSelectImports } from '@/shared/components/select/select.imports';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { fmtCurrency, fmtNum } from '../data-access/reporte-format.util';
import { ReporteFiltrosService } from '../data-access/reporte-filtros.service';
import { ReporteService } from '../data-access/reporte.service';
import { InventarioValorizadoReporte } from '../data-access/reporte.models';
import { ReporteFiltrosComponent } from '../ui/reporte-filtros/reporte-filtros.component';
import { ReporteKpi, ReporteKpiGridComponent } from '../ui/reporte-kpi-grid/reporte-kpi-grid.component';
import { ReporteExportarComponent } from '../ui/reporte-exportar/reporte-exportar.component';

@Component({
  selector: 'app-reporte-inventario',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ...ZardSelectImports,
    ...ZardTableImports,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ReporteFiltrosComponent,
    ReporteKpiGridComponent,
    ReporteExportarComponent,
  ],
  viewProviders: [provideIcons({ lucideBoxes })],
  templateUrl: './reporte-inventario.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteInventarioComponent {
  readonly filtros = inject(ReporteFiltrosService);
  private readonly reporteService = inject(ReporteService);
  private readonly categoriaService = inject(CategoriaService);

  readonly categoriaId = signal('');
  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly cargando = signal(true);
  readonly reporte = signal<InventarioValorizadoReporte | null>(null);

  constructor() {
    this.categoriaService
      .listar()
      .pipe(catchError(() => of([] as CategoriaResponse[])))
      .subscribe(cs => this.categorias.set(cs));

    effect(() => {
      this.filtros.sucursalId();
      this.categoriaId();
      this.cargar();
    });
  }

  cargar() {
    this.cargando.set(true);
    this.reporteService
      .inventarioValorizado({ sucursal_id: this.filtros.sucursalParaQuery(), categoria_id: this.categoriaId() || undefined })
      .pipe(catchError(() => of(null)))
      .subscribe(r => {
        this.reporte.set(r);
        this.cargando.set(false);
      });
  }

  setCategoria(v: string) {
    this.categoriaId.set(v);
  }

  readonly kpis = computed<ReporteKpi[]>(() => {
    const inv = this.reporte();
    if (!inv) return [];
    const categorias = inv.por_categoria;
    const productos = categorias.reduce((s, c) => s + c.numero_productos, 0);
    const top = [...categorias].sort((a, b) => Number(b.valor) - Number(a.valor))[0];

    return [
      { label: 'Valor total (a costo)', value: fmtCurrency(inv.valor_total), icon: 'lucideDollarSign', tono: 'accent', destacado: true, caption: `${fmtNum(productos)} producto(s) valorizados` },
      { label: 'Categorías con stock', value: fmtNum(categorias.length), icon: 'lucideLayers' },
      ...(top
        ? ([{ label: 'Categoría con más valor', value: top.nombre, icon: 'lucideBoxes', tono: 'positive' as const, caption: `${fmtCurrency(top.valor)} · ${fmtNum(top.numero_productos)} producto(s)` }] satisfies ReporteKpi[])
        : []),
    ];
  });
}
