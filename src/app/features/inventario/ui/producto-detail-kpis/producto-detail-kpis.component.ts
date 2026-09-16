import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTag,
  lucideWallet,
  lucideScale,
  lucidePercent,
  lucideBoxes,
} from '@ng-icons/lucide';

import { ProductoResponse } from '../../data-access/inventario.models';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';

@Component({
  selector: 'app-producto-detail-kpis',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ...ZardCardImports],
  template: `
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <!-- KPI 1: Precio de Venta -->
      <div z-card class="relative overflow-hidden p-4 rounded-xl border bg-card/60 transition-all duration-200 hover:border-emerald-500/30 hover:shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Precio de venta
          </span>
          <span class="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ng-icon name="lucideTag" class="size-4" />
          </span>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {{ producto().precio_venta | currency }}
          </p>
          <p class="text-[11px] text-muted-foreground mt-0.5">Precio base unitario</p>
        </div>
      </div>

      <!-- KPI 2: Costo -->
      <div z-card class="relative overflow-hidden p-4 rounded-xl border bg-card/60 transition-all duration-200 hover:border-primary/30 hover:shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Costo
          </span>
          <span class="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
            <ng-icon name="lucideWallet" class="size-4" />
          </span>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-bold tabular-nums text-foreground">
            {{ producto().costo | currency }}
          </p>
          <p class="text-[11px] text-muted-foreground mt-0.5">Costo de compra</p>
        </div>
      </div>

      <!-- KPI 3: Margen -->
      <div z-card class="relative overflow-hidden p-4 rounded-xl border bg-card/60 transition-all duration-200 hover:border-violet-500/30 hover:shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Margen
          </span>
          <span class="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <ng-icon name="lucideScale" class="size-4" />
          </span>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-bold tabular-nums" [class.text-destructive]="margen().monto < 0" [class.text-violet-600]="margen().monto >= 0" [class.dark:text-violet-400]="margen().monto >= 0">
            {{ margen().monto | currency }}
          </p>
          <p class="text-[11px] font-medium text-muted-foreground mt-0.5">
            <span class="inline-flex items-center rounded-full bg-violet-500/10 px-1.5 py-0.2 text-[10px] font-bold text-violet-600 dark:text-violet-400">
              {{ margen().pct | number: '1.0-1' }}%
            </span>
            sobre venta
          </p>
        </div>
      </div>

      <!-- KPI 4: Impuesto -->
      <div z-card class="relative overflow-hidden p-4 rounded-xl border bg-card/60 transition-all duration-200 hover:border-blue-500/30 hover:shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Impuesto
          </span>
          <span class="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ng-icon name="lucidePercent" class="size-4" />
          </span>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-bold tabular-nums text-foreground">
            {{ producto().impuesto_tasa }}%
          </p>
          <p class="text-[11px] text-muted-foreground mt-0.5">IVA aplicable</p>
        </div>
      </div>

      <!-- KPI 5: Stock Global -->
      <div z-card class="relative overflow-hidden p-4 rounded-xl border bg-card/60 transition-all duration-200 hover:border-primary/30 hover:shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Stock global
          </span>
          <span class="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <ng-icon name="lucideBoxes" class="size-4" />
          </span>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-bold tabular-nums text-primary">
            {{ totalStock() | number: '1.0-2' }}
          </p>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            {{ producto().unidad_medida | lowercase }}s en {{ producto().existencias?.length || 0 }} sucursal(es)
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideTag,
      lucideWallet,
      lucideScale,
      lucidePercent,
      lucideBoxes,
    }),
  ],
})
export class ProductoDetailKpisComponent {
  producto = input.required<ProductoResponse>();
  margen = input.required<{ monto: number; pct: number }>();
  totalStock = input.required<number>();
}
