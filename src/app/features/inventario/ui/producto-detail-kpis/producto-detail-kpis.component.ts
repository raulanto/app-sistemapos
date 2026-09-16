import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTag,
  lucideWallet,
  lucideScale,
  lucidePercent,
  lucideBoxes,
  lucideTrendingUp,
} from '@ng-icons/lucide';

import { ProductoResponse } from '../../data-access/inventario.models';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-producto-detail-kpis',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ZardBadgeComponent, ...ZardCardImports],
  template: `
    <div
      class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs"
    >
      <!-- KPI 1: Precio de Venta -->
      <z-card class="gap-3 transition-shadow duration-200 hover:shadow-md">
        <z-card-header>
          <z-card-description
            zDescription="Precio de Venta"
            class="text-xs font-medium uppercase tracking-wide"
          />
          <z-card-title
            [zTitle]="(producto().precio_venta | currency) || ''"
            class="mt-1 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
          />
          <z-card-action>
            <z-badge
              zType="outline"
              class="gap-1 font-medium text-emerald-600 dark:text-emerald-400"
            >
              <ng-icon name="lucideTag" class="size-3.5" />
              Precio base
            </z-badge>
          </z-card-action>
        </z-card-header>
        <z-card-footer
          class="flex-col items-start gap-1 border-t border-border/60 bg-transparent pt-3 text-xs"
        >
          <div class="line-clamp-1 font-medium text-muted-foreground">
            Valor unitario al público
          </div>
        </z-card-footer>
      </z-card>

      <!-- KPI 2: Costo -->
      <z-card class="gap-3 transition-shadow duration-200 hover:shadow-md">
        <z-card-header>
          <z-card-description
            zDescription="Costo de Compra"
            class="text-xs font-medium uppercase tracking-wide"
          />
          <z-card-title
            [zTitle]="(producto().costo | currency) || ''"
            class="mt-1 text-2xl font-semibold tabular-nums"
          />
          <z-card-action>
            <z-badge zType="outline" class="gap-1 font-medium">
              <ng-icon name="lucideWallet" class="size-3.5" />
              Costo
            </z-badge>
          </z-card-action>
        </z-card-header>
        <z-card-footer
          class="flex-col items-start gap-1 border-t border-border/60 bg-transparent pt-3 text-xs"
        >
          <div class="line-clamp-1 font-medium text-muted-foreground">Costo promedio ponderado</div>
        </z-card-footer>
      </z-card>

      <!-- KPI 3: Margen -->
      <z-card class="gap-3 transition-shadow duration-200 hover:shadow-md">
        <z-card-header>
          <z-card-description
            zDescription="Margen Bruto"
            class="text-xs font-medium uppercase tracking-wide"
          />
          <z-card-title
            [zTitle]="(margen().monto | currency) || ''"
            class="mt-1 text-2xl font-semibold tabular-nums"
            [class.text-destructive]="margen().monto < 0"
            [class.text-violet-600]="margen().monto >= 0"
            [class.dark:text-violet-400]="margen().monto >= 0"
          />
          <z-card-action>
            <z-badge zType="outline" class="gap-1 font-medium text-violet-600 dark:text-violet-400">
              <ng-icon name="lucideTrendingUp" class="size-3.5" />
              {{ margen().pct | number: '1.0-1' }}%
            </z-badge>
          </z-card-action>
        </z-card-header>
        <z-card-footer
          class="flex-col items-start gap-1 border-t border-border/60 bg-transparent pt-3 text-xs"
        >
          <div class="line-clamp-1 font-medium text-muted-foreground">
            Utilidad sobre precio de venta
          </div>
        </z-card-footer>
      </z-card>

      <!-- KPI 4: Impuesto -->
      <z-card class="gap-3 transition-shadow duration-200 hover:shadow-md">
        <z-card-header>
          <z-card-description
            zDescription="Impuesto"
            class="text-xs font-medium uppercase tracking-wide"
          />
          <z-card-title
            [zTitle]="((producto().impuesto_tasa | number: '1.0-2') || '0') + '%'"
            class="mt-1 text-2xl font-semibold tabular-nums"
          />
          <z-card-action>
            <z-badge zType="outline" class="gap-1 font-medium text-blue-600 dark:text-blue-400">
              <ng-icon name="lucidePercent" class="size-3.5" />
              IVA
            </z-badge>
          </z-card-action>
        </z-card-header>
        <z-card-footer
          class="flex-col items-start gap-1 border-t border-border/60 bg-transparent pt-3 text-xs"
        >
          <div class="line-clamp-1 font-medium text-muted-foreground">
            Tasa de impuesto aplicable
          </div>
        </z-card-footer>
      </z-card>

      <!-- KPI 5: Stock Global -->
      <z-card class="gap-3 transition-shadow duration-200 hover:shadow-md">
        <z-card-header>
          <z-card-description
            zDescription="Stock Global"
            class="text-xs font-medium uppercase tracking-wide"
          />
          <z-card-title
            [zTitle]="(totalStock() | number: '1.0-2') || '0'"
            class="mt-1 text-2xl font-semibold tabular-nums text-primary"
          />
          <z-card-action>
            <z-badge zType="outline" class="gap-1 font-medium text-primary">
              <ng-icon name="lucideBoxes" class="size-3.5" />
              Unidades
            </z-badge>
          </z-card-action>
        </z-card-header>
        <z-card-footer
          class="flex-col items-start gap-1 border-t border-border/60 bg-transparent pt-3 text-xs"
        >
          <div class="line-clamp-1 font-medium text-muted-foreground">
            {{ producto().unidad_medida | lowercase }}s en
            {{ producto().existencias?.length || 0 }} sucursal(es)
          </div>
        </z-card-footer>
      </z-card>
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
      lucideTrendingUp,
    }),
  ],
})
export class ProductoDetailKpisComponent {
  producto = input.required<ProductoResponse>();
  margen = input.required<{ monto: number; pct: number }>();
  totalStock = input.required<number>();
}
