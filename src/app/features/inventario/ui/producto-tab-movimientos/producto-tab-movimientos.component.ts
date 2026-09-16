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
      
      <!-- GRÁFICA DE LÍNEA DE SALIDAS Y VENTAS POR DÍA -->
      <div z-card class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ng-icon name="lucideTrendingUp" class="size-4 text-emerald-600 dark:text-emerald-400" />
            <h4 class="text-sm font-semibold text-foreground">Ventas y Salidas Diarias</h4>
          </div>
          <span class="text-xs text-muted-foreground font-mono">
            Total salidas: {{ totalSalidas() | number: '1.0-2' }}
          </span>
        </div>

        @if (chartSalidasData().length > 0) {
          <z-chart
            class="h-[250px] w-full"
            zType="line"
            [zData]="chartSalidasData()"
            [zConfig]="salidasConfig"
            [zSeries]="salidasSeries"
            [zOption]="chartOptions"
            [zYAxis]="true"
            zXAxisKey="fecha"
          >
            <z-chart-tooltip />
          </z-chart>
        } @else {
          <div class="py-6 text-center text-xs text-muted-foreground">
            No se registran salidas ni ventas en el historial de movimientos.
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
                          mov.tipo === 'entrada'
                            ? 'default'
                            : mov.tipo === 'salida' || mov.tipo === 'merma'
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
                          : mov.tipo === 'salida' || mov.tipo === 'merma'
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

  salidasConfig = {
    salidas: { label: 'Ventas / Salidas', color: '#10b981' },
  };

  salidasSeries = [
    {
      dataKey: 'salidas',
      smooth: true,
      showSymbol: true,
      strokeWidth: 2.5,
      symbolSize: 7,
    },
  ];

  chartOptions = {
    grid: {
      left: 10,
      right: 15,
      top: 15,
      bottom: 5,
      containLabel: true,
    },
    series: [
      {
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.01)' },
            ],
          },
        },
      },
    ],
  };

  chartSalidasData = computed(() => {
    const movs = this.movimientos();
    const sorted = [...movs].reverse();
    const agrupado = new Map<string, number>();

    for (const mov of sorted) {
      const tipo = String(mov.tipo).toLowerCase();
      if (tipo === 'salida' || tipo === 'merma' || tipo === 'ajuste_negativo' || tipo === 'venta') {
        const fecha = new Date(mov.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        agrupado.set(fecha, (agrupado.get(fecha) ?? 0) + Number(mov.cantidad));
      }
    }

    return Array.from(agrupado.entries()).map(([fecha, salidas]) => ({
      fecha,
      salidas,
    }));
  });

  totalSalidas = computed(() =>
    this.chartSalidasData().reduce((sum, item) => sum + item.salidas, 0),
  );
}


