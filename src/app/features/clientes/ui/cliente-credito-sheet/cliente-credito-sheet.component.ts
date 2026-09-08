import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Observable } from 'rxjs';

import { ClienteService } from '../../data-access/cliente.service';
import { ClienteResponse } from '../../data-access/clientes.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface ClienteCreditoSheetData {
  cliente: ClienteResponse;
  modo: 'abono' | 'limite';
}

@Component({
  selector: 'app-cliente-credito-sheet',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, ZardInputComponent],
  templateUrl: './cliente-credito-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'clienteCreditoSheet',
  host: { style: 'display: contents' },
})
export class ClienteCreditoSheetComponent {
  private clienteService = inject(ClienteService);

  readonly data = injectSheetData<ClienteCreditoSheetData>();
  readonly esAbono = this.data.modo === 'abono';

  readonly saldo = Number(this.data.cliente.saldo_credito) || 0;
  readonly limite = Number(this.data.cliente.limite_credito) || 0;
  readonly disponible = Math.max(0, this.limite - this.saldo);

  /** Abono: arranca en 0. Límite: arranca en el actual. */
  readonly monto = signal(this.esAbono ? 0 : this.limite);

  readonly valido = computed(() => {
    const n = this.monto();
    if (!Number.isFinite(n)) return false;
    return this.esAbono ? n > 0 : n >= 0;
  });

  setMonto(v: number) {
    const n = Number(v);
    this.monto.set(Number.isFinite(n) ? n : 0);
  }

  pagarTodo() {
    this.monto.set(this.saldo);
  }

  save(): Observable<ClienteResponse> | void {
    if (!this.valido()) return;
    const id = this.data.cliente.id;
    return this.esAbono
      ? this.clienteService.abonar(id, { monto: this.monto() })
      : this.clienteService.cambiarLimiteCredito(id, { limite_credito: this.monto() });
  }
}
