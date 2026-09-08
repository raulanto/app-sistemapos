import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Observable } from 'rxjs';

import { ClienteService } from '../../data-access/cliente.service';
import { MonederoResponse } from '../../data-access/clientes.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface MonederoAjusteSheetData {
  telefono: string;
  saldoActual: number;
}

@Component({
  selector: 'app-monedero-ajuste-sheet',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, ZardInputComponent],
  templateUrl: './monedero-ajuste-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'monederoAjusteSheet',
  host: { style: 'display: contents' },
})
export class MonederoAjusteSheetComponent {
  private clienteService = inject(ClienteService);
  readonly data = injectSheetData<MonederoAjusteSheetData>();

  /** Monto con signo: positivo carga saldo, negativo corrige a la baja. */
  readonly monto = signal(0);
  readonly motivo = signal('');

  readonly saldoResultante = computed(() => this.data.saldoActual + (Number(this.monto()) || 0));
  readonly valido = computed(() => {
    const n = Number(this.monto());
    return Number.isFinite(n) && n !== 0 && this.saldoResultante() >= -0.0001;
  });

  setMonto(v: number) {
    const n = Number(v);
    this.monto.set(Number.isFinite(n) ? n : 0);
  }

  save(): Observable<MonederoResponse> | void {
    if (!this.valido()) return;
    return this.clienteService.ajustarMonedero(this.data.telefono, {
      monto: Number(this.monto()),
      motivo: this.motivo().trim() || null,
    });
  }
}
