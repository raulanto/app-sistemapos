import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideHistory, lucideTrendingUp, lucideUser } from '@ng-icons/lucide';
import { MovimientoResponse } from '../../data-access/inventario.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../../shared/components/table/table.imports';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';
import { ZardChartImports } from '../../../../shared/components/chart/chart.imports';
import { ZardPaginationImports } from '../../../../shared/components/pagination/pagination.imports';

@Component({
  selector: 'app-producto-tab-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    ZardBadgeComponent,
    ...ZardCardImports,
    ...ZardTableImports,
    ZardEmptyComponent,
    ...ZardChartImports,
    ...ZardPaginationImports,
  ],
  template: `
    <div class="space-y-6 pt-4">
      
      <!-- GRÁFICA DE LÍNEA DE ENTRADAS Y SALIDAS POR DÍA -->
      <div z-card class="p-4 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div class="flex items-center gap-2">
            <ng-icon name="lucideTrendingUp" class="size-4 text-primary" />
            <div>
              <h4 class="text-sm font-bold text-foreground">Flujo diario de movimientos</h4>
              <p class="text-xs text-muted-foreground">Comparativa de entradas y salidas registradas.</p>
            </div>
          </div>
          <div class="flex items-center gap-3 text-xs font-mono">
            <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span class="size-2 rounded-full bg-emerald-500"></span>
              Entradas: {{ totalEntradas() | number: '1.0-2' }}
            </span>
            <span class="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
              <span class="size-2 rounded-full bg-rose-500"></span>
              Salidas: {{ totalSalidas() | number: '1.0-2' }}
            </span>
          </div>
        </div>

        @if (chartMovimientosData().length > 0) {
          <z-chart
            class="h-[260px] w-full"
            zType="bar"
            [zData]="chartMovimientosData()"
            [zConfig]="chartConfig"
            [zSeries]="chartSeries"
            [zOption]="chartOptions"
            [zYAxis]="true"
            [zStacked]="false"
            zXAxisKey="fecha"
          >
            <z-chart-tooltip />
            <z-chart-legend />
          </z-chart>
        } @else {
          <div class="py-8 text-center text-xs text-muted-foreground">
            No se registran entradas ni salidas en el historial de movimientos.
          </div>
        }
      </div>

      <!-- TABLA DE MOVIMIENTOS -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ng-icon name="lucideHistory" class="size-4 text-muted-foreground" />
            <h3 class="font-semibold text-foreground">Historial de movimientos</h3>
            <z-badge zType="secondary" class="tabular-nums font-mono">{{ movimientos().length }}</z-badge>
          </div>
          <span class="text-xs text-muted-foreground">
            Mostrando {{ rangoMostrado() }} de {{ movimientos().length }}
          </span>
        </div>

        <div z-card class="overflow-hidden py-0 border rounded-xl space-y-0">
          <div class="overflow-x-auto">
            <table z-table>
              <thead z-table-header class="bg-muted/50">
                <tr z-table-row>
                  <th z-table-head>Fecha</th>
                  <th z-table-head>Tipo</th>
                  <th z-table-head>Sucursal</th>
                  <th z-table-head class="text-right">Cantidad</th>
                  <th z-table-head class="text-right">Costo unit.</th>
                  <th z-table-head>Usuario</th>
                  <th z-table-head>Referencia / Motivo</th>
                </tr>
              </thead>
              <tbody z-table-body>
                @for (mov of movimientosPaginados(); track mov.id) {
                  <tr z-table-row>
                    <td z-table-cell class="whitespace-nowrap text-xs text-muted-foreground">
                      <span class="flex items-center gap-2">
                        <ng-icon name="lucideCalendar" class="size-3.5" />
                        {{ mov.created_at | date: 'dd/MM/yyyy HH:mm' }}
                      </span>
                    </td>
                    <td z-table-cell>
                      <z-badge
                        [zType]="
                          mov.tipo === 'entrada' || mov.tipo === 'ajuste_positivo'
                            ? 'default'
                            : mov.tipo === 'salida' || mov.tipo === 'merma' || mov.tipo === 'ajuste_negativo'
                              ? 'destructive'
                              : 'secondary'
                        "
                        class="uppercase text-[10px]"
                      >
                        {{ mov.tipo }}
                      </z-badge>
                    </td>
                    <td z-table-cell class="text-xs">{{ getNombreSucursalFn()(mov.sucursal_id) }}</td>
                    <td z-table-cell class="text-right tabular-nums font-medium">
                      {{
                        mov.tipo === 'entrada' || mov.tipo === 'ajuste_positivo'
                          ? '+'
                          : mov.tipo === 'salida' || mov.tipo === 'merma' || mov.tipo === 'ajuste_negativo'
                            ? '-'
                            : ''
                      }}{{ mov.cantidad }}
                    </td>
                    <td z-table-cell class="text-right tabular-nums text-muted-foreground">
                      {{ mov.costo_unitario != null ? (mov.costo_unitario | currency) : '—' }}
                    </td>
                    <td z-table-cell class="text-xs">
                      @if (mov.usuario?.nombre) {
                        <span class="flex items-center gap-1.5 text-muted-foreground">
                          <ng-icon name="lucideUser" class="size-3.5" />
                          {{ mov.usuario.nombre }}
                        </span>
                      } @else {
                        <span class="text-muted-foreground">—</span>
                      }
                    </td>
                    <td z-table-cell class="text-xs">
                      <div class="font-medium">{{ mov.referencia_tipo }}</div>
                      <div class="line-clamp-1 text-muted-foreground" [title]="mov.motivo || ''">
                        {{ mov.motivo || '—' }}
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr z-table-row>
                    <td z-table-cell colspan="7" class="p-0">
                      <z-empty
                        zIcon="lucideHistory"
                        zTitle="Sin movimientos"
                        zDescription="Aún no se ha registrado ningún movimiento para este producto."
                        class="py-10"
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- CONTROLES DE PAGINACIÓN DE ZARD UI -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between border-t px-4 py-3 bg-muted/20">
              <span class="text-xs text-muted-foreground">
                Página {{ pageIndex() }} de {{ totalPages() }}
              </span>
              <z-pagination
                [zPageIndex]="pageIndex()"
                [zTotal]="totalPages()"
                zSize="icon-sm"
                (zPageIndexChange)="pageIndex.set($event)"
              />
            </div>
          }
        </div>
      </div>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideHistory,
      lucideCalendar,
      lucideUser,
      lucideTrendingUp,
    }),
  ],
})
export class ProductoTabMovimientosComponent {
  movimientos = input.required<MovimientoResponse[]>();
  getNombreSucursalFn = input.required<(id: string) => string>();

  // Configuración de Paginación
  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(1);

  readonly totalPages = computed(() => {
    const count = this.movimientos().length;
    return Math.max(1, Math.ceil(count / this.pageSize()));
  });

  readonly movimientosPaginados = computed(() => {
    const list = this.movimientos();
    const size = this.pageSize();
    const index = Math.min(Math.max(1, this.pageIndex()), this.totalPages());
    const start = (index - 1) * size;
    return list.slice(start, start + size);
  });

  readonly rangoMostrado = computed(() => {
    const total = this.movimientos().length;
    if (total === 0) return '0';
    const index = Math.min(Math.max(1, this.pageIndex()), this.totalPages());
    const start = (index - 1) * this.pageSize() + 1;
    const end = Math.min(index * this.pageSize(), total);
    return `${start}-${end}`;
  });

  chartConfig = {
    entradas: { label: 'Entradas', color: '#10b981' },
    salidas: { label: 'Salidas', color: '#f43f5e' },
  };

  chartSeries = [
    { dataKey: 'entradas' },
    { dataKey: 'salidas' },
  ];

  chartOptions = {
    grid: {
      left: 10,
      right: 15,
      top: 15,
      bottom: 5,
      containLabel: true,
    },
  };

  chartMovimientosData = computed(() => {
    const movs = this.movimientos();
    const sorted = [...movs].reverse();
    const agrupado = new Map<string, { entradas: number; salidas: number }>();

    for (const mov of sorted) {
      const fecha = new Date(mov.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      if (!agrupado.has(fecha)) {
        agrupado.set(fecha, { entradas: 0, salidas: 0 });
      }
      const entry = agrupado.get(fecha)!;
      const tipo = String(mov.tipo).toLowerCase();
      const cantidad = Number(mov.cantidad) || 0;

      if (tipo === 'entrada' || tipo === 'ajuste_positivo' || tipo === 'compra') {
        entry.entradas += cantidad;
      } else if (tipo === 'salida' || tipo === 'merma' || tipo === 'ajuste_negativo' || tipo === 'venta') {
        entry.salidas += cantidad;
      }
    }

    return Array.from(agrupado.entries()).map(([fecha, vals]) => ({
      fecha,
      entradas: vals.entradas,
      salidas: vals.salidas,
    }));
  });

  totalEntradas = computed(() =>
    this.chartMovimientosData().reduce((sum, item) => sum + item.entradas, 0),
  );

  totalSalidas = computed(() =>
    this.chartMovimientosData().reduce((sum, item) => sum + item.salidas, 0),
  );
}


