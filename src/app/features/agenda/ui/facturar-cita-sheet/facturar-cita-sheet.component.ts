import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideX } from '@ng-icons/lucide';

import { AgendaService } from '../../data-access/agenda.service';
import { CitaResponse, FacturarCitaRequest, MetodoPago, VentaResponse } from '../../data-access/agenda.models';
import { METODOS_PAGO } from '../../../ventas/data-access/ventas.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

export interface FacturarCitaSheetData {
  cita: CitaResponse;
  /** Precio vigente del servicio (se recalcula del lado del servidor al facturar). */
  total: number;
  /** Turno de caja abierto (validado por quien abre el sheet). */
  turnoId: string;
}

interface PagoFila {
  monto: number;
  metodo_pago: MetodoPago;
  monto_recibido?: number;
}

@Component({
  selector: 'app-facturar-cita-sheet',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, NgIconComponent, ZardInputComponent, ZardButtonComponent],
  viewProviders: [provideIcons({ lucidePlus, lucideX })],
  templateUrl: './facturar-cita-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'facturarCitaSheet',
  host: { style: 'display: contents' },
})
export class FacturarCitaSheetComponent {
  private agendaService = inject(AgendaService);
  readonly sheetData = injectSheetData<FacturarCitaSheetData>();

  readonly metodos = METODOS_PAGO;
  readonly total = this.sheetData.total;
  readonly tieneCliente = !!this.sheetData.cita.cliente_id;

  readonly pagos = signal<PagoFila[]>([{ monto: this.round(this.total), metodo_pago: 'efectivo' }]);

  private idemKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

  readonly pagado = computed(() => this.pagos().reduce((s, p) => s + (Number(p.monto) || 0), 0));
  readonly faltante = computed(() => this.round(this.total - this.pagado()));
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
    const req: FacturarCitaRequest = {
      caja_turno_id: this.sheetData.turnoId,
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
    return this.agendaService.facturar(this.sheetData.cita.id, req, this.idemKey);
  }
}
