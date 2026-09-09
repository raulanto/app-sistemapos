import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideX } from '@ng-icons/lucide';

import { PedidoService } from '../../data-access/pedido.service';
import {
  FacturarPedidoRequest,
  MetodoPago,
  PedidoResponse,
  VentaResponse,
} from '../../data-access/pedidos.models';
import { METODOS_PAGO } from '../../../ventas/data-access/ventas.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';

export interface FacturarSheetData {
  pedido: PedidoResponse;
  /** Turno de caja abierto (validado por quien abre el sheet). */
  turnoId: string;
}

interface PagoFila {
  monto: number;
  metodo_pago: MetodoPago;
  monto_recibido?: number;
}

@Component({
  selector: 'app-facturar-sheet',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    NgIconComponent,
    ...ZardFieldImports,
    ...ZardSelectImports,
    ZardInputComponent,
    ZardButtonComponent,
    ZardCheckboxComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideX })],
  templateUrl: './facturar-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'facturarSheet',
  host: { style: 'display: contents' },
})
export class FacturarSheetComponent {
  private pedidoService = inject(PedidoService);
  readonly sheetData = injectSheetData<FacturarSheetData>();

  readonly metodos = METODOS_PAGO;

  readonly total = Number(this.sheetData.pedido.total) || 0;
  readonly anticipos = Number(this.sheetData.pedido.total_anticipos) || 0;
  readonly saldoPorCobrar = Number(this.sheetData.pedido.saldo_por_cobrar) || 0;
  readonly tieneCliente = !!this.sheetData.pedido.cliente_id;

  readonly recalcular = signal(false);
  readonly pagos = signal<PagoFila[]>(
    this.saldoPorCobrar > 0.009 ? [{ monto: this.round(this.saldoPorCobrar), metodo_pago: 'efectivo' }] : [],
  );

  private idemKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

  readonly pagado = computed(() => this.pagos().reduce((s, p) => s + (Number(p.monto) || 0), 0));
  /** Σ pagos + anticipos frente al total del pedido. */
  readonly cubierto = computed(() => this.round(this.pagado() + this.anticipos));
  readonly faltante = computed(() => this.round(this.total - this.cubierto()));
  /** Falta dinero y no hay cliente al que cargarle el crédito → el backend rechaza. */
  readonly creditoSinCliente = computed(() => this.faltante() > 0.009 && !this.tieneCliente);
  readonly cambioTotal = computed(() =>
    this.pagos().reduce(
      (s, p) => s + (p.metodo_pago === 'efectivo' && p.monto_recibido ? Math.max(0, p.monto_recibido - p.monto) : 0),
      0,
    ),
  );

  private round(n: number) {
    return Math.round(n * 100) / 100;
  }

  agregarPago(metodo: MetodoPago) {
    const falta = Math.max(0, this.faltante());
    this.pagos.update(list => [...list, { monto: this.round(falta), metodo_pago: metodo }]);
  }

  setMonto(i: number, v: number) {
    this.pagos.update(list => list.map((p, idx) => (idx === i ? { ...p, monto: Math.max(0, Number(v) || 0) } : p)));
  }

  setRecibido(i: number, v: number) {
    const n = Number(v);
    this.pagos.update(list =>
      list.map((p, idx) => (idx === i ? { ...p, monto_recibido: Number.isFinite(n) && n > 0 ? n : undefined } : p)),
    );
  }

  quitarPago(i: number) {
    this.pagos.update(list => list.filter((_, idx) => idx !== i));
  }

  save(): Observable<VentaResponse> {
    const req: FacturarPedidoRequest = {
      caja_turno_id: this.sheetData.turnoId,
      recalcular_precios: this.recalcular(),
      pagos: this.pagos()
        .filter(p => p.monto > 0)
        .map(p => ({
          monto: this.round(p.monto),
          metodo_pago: p.metodo_pago,
          ...(p.metodo_pago === 'efectivo' && p.monto_recibido && p.monto_recibido >= p.monto
            ? { monto_recibido: this.round(p.monto_recibido) }
            : {}),
        })),
    };
    return this.pedidoService.facturar(this.sheetData.pedido.id, req, this.idemKey);
  }
}
