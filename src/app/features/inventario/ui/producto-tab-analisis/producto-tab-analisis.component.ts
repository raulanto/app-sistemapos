import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ZardChartImports } from '../../../../shared/components/chart/chart.imports';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';

@Component({
  selector: 'app-producto-tab-analisis',
  standalone: true,
  imports: [CommonModule, ...ZardChartImports, ZardEmptyComponent],
  template: `
    <div class="space-y-4 pt-4">
      <div class="flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-[3px] text-sm font-medium">
        <button
          type="button"
          class="rounded-md px-3 py-1 transition"
          [class.bg-background]="grafica() === 'balance'"
          [class.shadow-sm]="grafica() === 'balance'"
          [class.text-foreground]="grafica() === 'balance'"
          [class.text-muted-foreground]="grafica() !== 'balance'"
          (click)="graficaChange.emit('balance')"
        >
          Balance
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1 transition"
          [class.bg-background]="grafica() === 'costo'"
          [class.shadow-sm]="grafica() === 'costo'"
          [class.text-foreground]="grafica() === 'costo'"
          [class.text-muted-foreground]="grafica() !== 'costo'"
          (click)="graficaChange.emit('costo')"
        >
          Costo
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1 transition"
          [class.bg-background]="grafica() === 'stock'"
          [class.shadow-sm]="grafica() === 'stock'"
          [class.text-foreground]="grafica() === 'stock'"
          [class.text-muted-foreground]="grafica() !== 'stock'"
          (click)="graficaChange.emit('stock')"
        >
          Stock
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1 transition"
          [class.bg-background]="grafica() === 'tipos'"
          [class.shadow-sm]="grafica() === 'tipos'"
          [class.text-foreground]="grafica() === 'tipos'"
          [class.text-muted-foreground]="grafica() !== 'tipos'"
          (click)="graficaChange.emit('tipos')"
        >
          Tipos
        </button>
      </div>
      @switch (grafica()) {
        @case ('balance') {
          <div class="pt-4">
            @if (chartData().length > 0) {
              <z-chart
                class="block w-full"
                zType="bar"
                [zData]="chartData()"
                [zConfig]="chartConfig()"
                [zSeries]="chartSeries()"
                [zOption]="chartOptions()"
                zXAxisKey="fecha"
                [zStacked]="false"
              >
                <z-chart-tooltip />
                <z-chart-legend />
              </z-chart>
            } @else {
              <z-empty
                zIcon="lucideActivity"
                zTitle="Sin datos"
                zDescription="Registra movimientos para ver entradas y salidas por fecha."
                class="py-10"
              />
            }
          </div>
        }
        @case ('costo') {
          <div class="pt-4">
            @if (costoTrend().length > 1) {
              <z-chart
                class="block w-full"
                zType="line"
                [zData]="costoTrend()"
                [zConfig]="costoConfig()"
                [zSeries]="costoSeries()"
                zXAxisKey="fecha"
              >
                <z-chart-tooltip />
              </z-chart>
            } @else {
              <z-empty
                zIcon="lucideTrendingUp"
                zTitle="Sin historial de costo"
                zDescription="Se necesitan al menos dos entradas con costo unitario."
                class="py-10"
              />
            }
          </div>
        }
        @case ('stock') {
          <div class="pt-4">
            @if (stockPorSucursal().length > 0) {
              <z-chart
                class="block w-full"
                zType="bar"
                [zData]="stockPorSucursal()"
                [zConfig]="stockConfig()"
                [zSeries]="stockSeries()"
                zXAxisKey="sucursal"
              >
                <z-chart-tooltip />
              </z-chart>
            } @else {
              <z-empty
                zIcon="lucideBoxes"
                zTitle="Sin existencias"
                zDescription="Este producto no tiene stock registrado."
                class="py-10"
              />
            }
          </div>
        }
        @case ('tipos') {
          <div class="pt-4">
            @if (movimientosPorTipo().length > 0) {
              <z-chart
                class="block w-full"
                zType="pie"
                [zData]="movimientosPorTipo()"
                [zSeries]="tipoSeries()"
                zXAxisKey="tipo"
              >
                <z-chart-tooltip />
                <z-chart-legend />
              </z-chart>
            } @else {
              <z-empty
                zIcon="lucideHistory"
                zTitle="Sin movimientos"
                zDescription="Aún no hay movimientos registrados."
                class="py-10"
              />
            }
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoTabAnalisisComponent {
  grafica = input.required<'balance' | 'costo' | 'stock' | 'tipos'>();
  chartData = input.required<any[]>();
  chartConfig = input.required<any>();
  chartSeries = input.required<any[]>();
  chartOptions = input.required<any>();
  costoTrend = input.required<any[]>();
  costoConfig = input.required<any>();
  costoSeries = input.required<any[]>();
  stockPorSucursal = input.required<any[]>();
  stockConfig = input.required<any>();
  stockSeries = input.required<any[]>();
  movimientosPorTipo = input.required<any[]>();
  tipoSeries = input.required<any[]>();

  graficaChange = output<'balance' | 'costo' | 'stock' | 'tipos'>();
}
