import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideWallet, lucideX } from '@ng-icons/lucide';

import { METODOS_PAGO, MetodoPago } from '../../data-access/ventas.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

interface PagoLinea {
  monto: number;
  metodo_pago: MetodoPago;
  monto_recibido?: number;
}

@Component({
  selector: 'app-pos-pagos',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, NgIconComponent, ZardBadgeComponent, ZardButtonComponent, ZardInputComponent],
  viewProviders: [provideIcons({ lucideWallet, lucideX })],
  template: `
    <div class="space-y-1.5">
      @for (p of pagos(); track $index) {
        <div class="flex items-center gap-2">
          <z-badge zType="outline" class="w-28 justify-center capitalize">{{ p.metodo_pago.replace('_', ' ') }}</z-badge>
          <input z-input class="flex-1 text-right" type="number" min="0" step="0.01" [ngModel]="p.monto" (ngModelChange)="setMontoPago.emit({ i: $index, monto: $event })" />
          <button z-button zType="ghost" zSize="icon-sm" (click)="quitarPago.emit($index)"><ng-icon name="lucideX" class="size-4" /></button>
        </div>
        @if (p.metodo_pago === 'efectivo') {
          <div class="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
            <span class="w-28 text-right">Recibí con</span>
            <input z-input class="flex-1 text-right" type="number" min="0" step="0.01" placeholder="—"
                   [ngModel]="p.monto_recibido ?? null" (ngModelChange)="setRecibido.emit({ i: $index, v: $event })" />
            <span class="w-16 text-right tabular-nums" [class.text-green-600]="cambioPago(p) > 0">
              {{ cambioPago(p) > 0 ? (cambioPago(p) | currency) : '' }}
            </span>
          </div>
        }
      }
      <div class="flex flex-wrap gap-1.5">
        @for (m of metodosPago; track m.value) {
          <button z-button zType="outline" zSize="sm" (click)="agregarPago.emit(m.value)">+ {{ m.label }}</button>
        }
        @if (monederoDisponible() > 0) {
          <button z-button zType="outline" zSize="sm" (click)="agregarPago.emit('monedero')">
            <ng-icon name="lucideWallet" class="mr-1 size-3.5" /> Monedero
          </button>
        }
        <button z-button zType="secondary" zSize="sm" (click)="pagoExacto.emit()">Efectivo exacto</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class PosPagosComponent {
  readonly pagos = input<PagoLinea[]>([]);
  readonly monederoDisponible = input(0);

  readonly agregarPago = output<MetodoPago>();
  readonly setMontoPago = output<{ i: number; monto: number }>();
  readonly setRecibido = output<{ i: number; v: number }>();
  readonly quitarPago = output<number>();
  readonly pagoExacto = output<void>();

  readonly metodosPago = METODOS_PAGO;

  cambioPago(p: PagoLinea): number {
    if (p.metodo_pago !== 'efectivo' || !p.monto_recibido) return 0;
    return Math.max(0, Math.round((p.monto_recibido - p.monto) * 100) / 100);
  }
}
