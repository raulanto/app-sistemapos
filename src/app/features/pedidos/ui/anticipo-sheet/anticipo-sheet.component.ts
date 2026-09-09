import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CurrencyPipe, ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  template: `
    <form [formGroup]="form" class="grid min-h-0 flex-1 auto-rows-min gap-5 px-4 pb-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        Prepago o seña. Baja el saldo por cobrar del pedido; al facturar entra como pago de la venta.
        Saldo actual: <span class="font-medium text-foreground">{{ sheetData.saldoPorCobrar | currency }}</span>.
      </p>

      <div z-field>
        <label z-field-label for="monto">Monto *</label>
        <input z-input id="monto" type="number" min="0.01" step="0.01" formControlName="monto" placeholder="0.00" />
        @if (form.controls.monto.invalid && form.controls.monto.touched) {
          <p class="text-[0.8rem] font-medium text-destructive">Ingresa un monto mayor a 0.</p>
        }
      </div>

      <div z-field>
        <label z-field-label>Método *</label>
        <z-select formControlName="metodo_pago" placeholder="Selecciona el método">
          @for (m of metodos; track m.value) {
            <z-select-item [zValue]="m.value">{{ m.label }}</z-select-item>
          }
        </z-select>
      </div>

      <div z-field>
        <label z-field-label for="referencia">Referencia (opcional)</label>
        <input z-input id="referencia" formControlName="referencia" placeholder="Ej. autorización de la terminal" />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'anticipoSheet',
  host: { style: 'display: contents' },
})
export class AnticipoSheetComponent {
  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  readonly sheetData = injectSheetData<AnticipoSheetData>();

  readonly metodos = METODOS_ANTICIPO;

  form = this.fb.group({
    monto: [this.sheetData.saldoPorCobrar > 0 ? this.sheetData.saldoPorCobrar : null, [Validators.required, Validators.min(0.01)]],
    metodo_pago: ['efectivo', Validators.required],
    referencia: [''],
  });

  save(): Observable<PedidoResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const d = this.form.getRawValue();
    const req: AnticipoRequest = {
      monto: Number(d.monto),
      metodo_pago: d.metodo_pago as AnticipoRequest['metodo_pago'],
      referencia: d.referencia?.trim() || null,
    };
    return this.pedidoService.anticipo(this.sheetData.pedidoId, req);
  }
}
