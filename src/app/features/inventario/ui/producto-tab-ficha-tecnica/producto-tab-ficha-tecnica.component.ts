import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideInfo,
  lucideScale,
  lucideShieldCheck,
  lucideTag,
  lucideBoxes,
  lucidePercent,
  lucideCheckCircle2,
  lucideXCircle,
  lucideSparkles,
} from '@ng-icons/lucide';

import { ProductoResponse, UnidadMedidaResponse } from '../../data-access/inventario.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardCardImports } from '../../../../shared/components/card/card.imports';

@Component({
  selector: 'app-producto-tab-ficha-tecnica',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ZardBadgeComponent, ...ZardCardImports],
  template: `
    <div class="space-y-6 pt-4">
      
      <!-- GRID DE MINIGRAFICOS Y MÉTRICAS CLAVE DE LA FICHA TÉCNICA -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        
        <!-- Minigráfico 1: Distribución de Precio vs Costo (Margen) -->
        <div z-card class="p-4 space-y-3">
          <div class="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Estructura de Precio</span>
            <span class="text-violet-600 dark:text-violet-400 font-semibold">{{ pctCosto() | number: '1.0-1' }}% costo</span>
          </div>
          
          <div class="space-y-1">
            <div class="flex justify-between items-baseline">
              <span class="text-xl font-bold tabular-nums text-foreground">{{ producto().precio_venta | currency }}</span>
              <span class="text-xs text-muted-foreground">Costo: {{ producto().costo | currency }}</span>
            </div>
            
            <!-- Visual Bar Component -->
            <div class="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
              <div
                class="bg-muted-foreground/40 h-full transition-all duration-500"
                [style.width.%]="pctCosto()"
                title="Costo"
              ></div>
              <div
                class="bg-emerald-500 h-full transition-all duration-500"
                [style.width.%]="pctMargen()"
                title="Margen de ganancia"
              ></div>
            </div>
          </div>
          
          <p class="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Margen neto: <strong>{{ margenMonto() | currency }}</strong></span>
            <span class="text-emerald-600 dark:text-emerald-400 font-medium">+{{ pctMargen() | number: '1.0-1' }}% ganancias</span>
          </p>
        </div>

        <!-- Minigráfico 2: Carga Fiscal (Impuesto) -->
        <div z-card class="p-4 space-y-3">
          <div class="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Desglose de Impuesto</span>
            <span class="text-blue-600 dark:text-blue-400 font-semibold">{{ producto().impuesto_tasa }}% tasa</span>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between items-baseline">
              <span class="text-xl font-bold tabular-nums text-foreground">{{ montoImpuesto() | currency }}</span>
              <span class="text-xs text-muted-foreground">IVA por unidad</span>
            </div>

            <!-- Visual Meter -->
            <div class="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="bg-blue-500 h-full transition-all duration-500"
                [style.width.%]="mathMin(Number(producto().impuesto_tasa || 0) * 4, 100)"
              ></div>
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground">
            Precio final con IVA: <strong class="text-foreground">{{ (Number(producto().precio_venta || 0) + montoImpuesto()) | currency }}</strong>
          </p>
        </div>

        <!-- Minigráfico 3: Indicadores de Configuración -->
        <div z-card class="p-4 space-y-3">
          <div class="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Capacidad y Fraccionamiento</span>
            <span class="text-primary font-semibold">{{ producto().unidad_medida }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="rounded-lg bg-muted/50 p-2 text-center space-y-0.5 border">
              <span class="text-[10px] text-muted-foreground uppercase font-semibold">Fraccionable</span>
              <p class="text-xs font-bold text-foreground">
                {{ producto().permite_venta_fraccionada ? 'Sí (Permitido)' : 'No (Solo entero)' }}
              </p>
            </div>
            <div class="rounded-lg bg-muted/50 p-2 text-center space-y-0.5 border">
              <span class="text-[10px] text-muted-foreground uppercase font-semibold">Stock Negativo</span>
              <p class="text-xs font-bold" [class.text-destructive]="producto().permite_stock_negativo">
                {{ producto().permite_stock_negativo ? 'Permitido' : 'Bloqueado' }}
              </p>
            </div>
          </div>
        </div>

      </div>

      <!-- DETALLE COMPLETO EN TARJETAS SECCIONADAS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Sección 1: Identificación y Clasificación -->
        <div z-card>
          <z-card-header class="pb-3 border-b">
            <div class="flex items-center gap-2">
              <ng-icon name="lucideInfo" class="size-4 text-primary" />
              <z-card-title zTitle="Clasificación y Catálogo" class="text-sm font-semibold" />
            </div>
          </z-card-header>
          <z-card-content class="pt-4">
            <dl class="divide-y divide-border text-sm">
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-muted-foreground">Categoría principal</dt>
                <dd class="font-medium text-foreground">{{ producto().categoria?.nombre || 'General' }}</dd>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-muted-foreground">Unidad de Medida Base</dt>
                <dd class="font-medium text-foreground">{{ producto().unidad_medida }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 py-2.5">
                <dt class="text-muted-foreground">Código de Barras</dt>
                <dd class="font-mono text-xs bg-muted px-2 py-0.5 rounded font-medium text-foreground">{{ producto().codigo_barras || 'Sin código registrado' }}</dd>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-muted-foreground">Tipo de Producto</dt>
                <dd class="font-medium capitalize text-foreground">{{ producto().tipo || 'simple' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 py-2.5">
                <dt class="text-muted-foreground">Unidad del Catálogo SAT/Oficial</dt>
                @if (unidadMedidaVinculada(); as um) {
                  <dd class="truncate font-medium text-foreground">{{ um.codigo }} — {{ um.nombre }}</dd>
                } @else {
                  <dd class="text-muted-foreground text-xs italic">Sin vincular a catálogo</dd>
                }
              </div>
            </dl>
          </z-card-content>
        </div>

        <!-- Sección 2: Políticas Comerciales y Controles -->
        <div z-card>
          <z-card-header class="pb-3 border-b">
            <div class="flex items-center gap-2">
              <ng-icon name="lucideShieldCheck" class="size-4 text-primary" />
              <z-card-title zTitle="Reglas Comerciales y Control" class="text-sm font-semibold" />
            </div>
          </z-card-header>
          <z-card-content class="pt-4">
            <dl class="divide-y divide-border text-sm">
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-muted-foreground">Venta Sobre Pedido</dt>
                <dd>
                  <z-badge [zType]="producto().es_sobre_pedido ? 'default' : 'secondary'">
                    {{ producto().es_sobre_pedido ? 'Sí' : 'No' }}
                  </z-badge>
                </dd>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-muted-foreground">Precio Incluye IVA</dt>
                <dd>
                  <z-badge [zType]="producto().precio_incluye_impuesto ? 'default' : 'secondary'">
                    {{ producto().precio_incluye_impuesto ? 'Incluido' : 'Desglosado' }}
                  </z-badge>
                </dd>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-muted-foreground">Control por Lote / Caducidad</dt>
                <dd>
                  <z-badge [zType]="producto().requiere_lote ? 'default' : 'secondary'">
                    {{ producto().requiere_lote ? 'FEFO (Lotes requeridos)' : 'Sin lote' }}
                  </z-badge>
                </dd>
              </div>
              @if (producto().rastrea_instancia_abierta) {
                <div class="flex items-center justify-between py-2.5">
                  <dt class="text-muted-foreground">Envases / Fracciones Abiertas</dt>
                  <dd class="font-medium tabular-nums text-foreground">
                    {{ producto().instancia_capacidad_default || '—' }} {{ producto().unidad_medida | lowercase }} por envase
                  </dd>
                </div>
              }
              @if (producto().precio_mayoreo) {
                <div class="flex items-center justify-between py-2.5">
                  <dt class="text-muted-foreground">Precio Mayoreo</dt>
                  <dd class="font-medium tabular-nums text-foreground">
                    {{ producto().precio_mayoreo | currency }} (desde {{ producto().cantidad_minima_mayoreo }} {{ producto().unidad_medida | lowercase }})
                  </dd>
                </div>
              }
              @if (producto().monedero_pct || producto().monedero_monto) {
                <div class="flex items-center justify-between py-2.5">
                  <dt class="text-muted-foreground">Puntos / Monedero</dt>
                  <dd class="font-medium tabular-nums text-foreground">
                    @if (producto().monedero_pct) {
                      {{ producto().monedero_pct }}% del subtotal
                    } @else {
                      {{ producto().monedero_monto | currency }} por unidad
                    }
                  </dd>
                </div>
              }
            </dl>
          </z-card-content>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideInfo,
      lucideScale,
      lucideShieldCheck,
      lucideTag,
      lucideBoxes,
      lucidePercent,
      lucideCheckCircle2,
      lucideXCircle,
      lucideSparkles,
    }),
  ],
})
export class ProductoTabFichaTecnicaComponent {
  producto = input.required<ProductoResponse>();
  unidadesLength = input<number>(0);
  unidadMedidaVinculada = input<UnidadMedidaResponse | null>(null);

  Number = Number;
  mathMin = Math.min;

  precioVenta = computed(() => Number(this.producto()?.precio_venta || 0));
  costo = computed(() => Number(this.producto()?.costo || 0));
  margenMonto = computed(() => this.precioVenta() - this.costo());

  pctCosto = computed(() => {
    const pv = this.precioVenta();
    if (pv <= 0) return 0;
    return Math.min(100, Math.max(0, (this.costo() / pv) * 100));
  });

  pctMargen = computed(() => {
    const pv = this.precioVenta();
    if (pv <= 0) return 0;
    return Math.min(100, Math.max(0, (this.margenMonto() / pv) * 100));
  });

  montoImpuesto = computed(() => {
    const pv = this.precioVenta();
    const tasa = Number(this.producto()?.impuesto_tasa || 0);
    return pv * (tasa / 100);
  });
}

