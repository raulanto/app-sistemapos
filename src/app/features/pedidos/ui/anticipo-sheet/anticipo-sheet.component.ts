import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { form, FormField, required, validate } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { PedidoService } from '../../data-access/pedido.service';
import { AnticipoRequest, METODOS_ANTICIPO, PedidoResponse } from '../../data-access/pedidos.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface AnticipoSheetData {
  pedidoId: string;
  /** Lo que falta cobrar; se propone como monto del anticipo. */
  saldoPorCobrar: number;
}

@Component({
  selector: 'app-anticipo-sheet',
  standalone: true,
  imports: [CurrencyPipe, FormField, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  template: `
    <form class="grid min-h-0 flex-1 auto-rows-min gap-5 px-4 pb-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        Prepago o seña. Baja el saldo por cobrar del pedido; al facturar entra como pago de la venta.
        Saldo actual: <span class="font-medium text-foreground">{{ sheetData.saldoPorCobrar | currency }}</span>.
      </p>

      @let monto = anticipoForm.monto();
      @let montoInvalid = monto.invalid() && monto.touched();
      <div z-field [attr.data-invalid]="montoInvalid || null">
        <label z-field-label for="monto">Monto *</label>
        <input z-input id="monto" type="number" step="0.01" placeholder="0.00"
          [formField]="anticipoForm.monto" [attr.aria-invalid]="montoInvalid || null" />
        @if (montoInvalid) {
          <z-field-error [zErrors]="monto.errors()" />
        }
      </div>

      <div z-field>
        <label z-field-label>Método *</label>
        <z-select [formField]="anticipoForm.metodo_pago" placeholder="Selecciona el método">
          @for (m of metodos; track m.value) {
            <z-select-item [zValue]="m.value">{{ m.label }}</z-select-item>
          }
        </z-select>
      </div>

      <div z-field>
        <label z-field-label for="referencia">Referencia (opcional)</label>
        <input z-input id="referencia" placeholder="Ej. autorización de la terminal" [formField]="anticipoForm.referencia" />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'anticipoSheet',
  host: { style: 'display: contents' },
})
export class AnticipoSheetComponent {
  private pedidoService = inject(PedidoService);
  readonly sheetData = injectSheetData<AnticipoSheetData>();

  readonly metodos = METODOS_ANTICIPO;

  private readonly model = signal({
    monto: (this.sheetData.saldoPorCobrar > 0 ? this.sheetData.saldoPorCobrar : null) as number | null,
    metodo_pago: 'efectivo',
    referencia: '',
  });

  protected readonly anticipoForm = form(this.model, path => {
    validate(path.monto, ({ value }) => {
      const v = value();
      return v != null && v > 0 ? undefined : { kind: 'montoInvalido', message: 'Ingresa un monto mayor a 0.' };
    });
    required(path.metodo_pago, { message: 'Selecciona el método.' });
  });

  save(): Observable<PedidoResponse> | void {
    const root = this.anticipoForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }
    const d = this.model();
    const req: AnticipoRequest = {
      monto: Number(d.monto),
      metodo_pago: d.metodo_pago as AnticipoRequest['metodo_pago'],
      referencia: d.referencia?.trim() || null,
    };
    return this.pedidoService.anticipo(this.sheetData.pedidoId, req);
  }
}
