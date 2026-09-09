import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { CajaService } from '../../data-access/caja.service';
import { CajaTurnoResponse } from '../../data-access/ventas.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface ConciliarTurnoSheetData {
  turno: CajaTurnoResponse;
}

@Component({
  selector: 'app-conciliar-turno-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, ...ZardFieldImports, ZardInputComponent],
  template: `
    <form [formGroup]="form" class="grid min-h-0 flex-1 auto-rows-min gap-5 px-4 pb-4 overflow-y-auto">
      <dl class="rounded-md border text-sm">
        <div class="flex justify-between border-b px-3 py-2">
          <dt class="text-muted-foreground">Efectivo declarado</dt>
          <dd class="tabular-nums">{{ sheetData.turno.saldo_final_declarado | currency }}</dd>
        </div>
        <div class="flex justify-between px-3 py-2 font-medium">
          <dt>Diferencia</dt>
          <dd class="tabular-nums" [class.text-destructive]="+(sheetData.turno.diferencia ?? 0) < 0"
              [class.text-green-600]="+(sheetData.turno.diferencia ?? 0) > 0">
            {{ sheetData.turno.diferencia | currency }}
          </dd>
        </div>
      </dl>

      @if (sheetData.turno.nota_cierre) {
        <p class="text-sm"><span class="text-muted-foreground">Nota del cajero:</span> {{ sheetData.turno.nota_cierre }}</p>
      }

      <div z-field>
        <label z-field-label for="nota">Nota de conciliación</label>
        <input z-input id="nota" type="text" formControlName="nota" placeholder="Ej. autorizado, se descuenta de caja chica" />
      </div>
      <p class="text-[0.8rem] text-muted-foreground">El turno pasará a estado <strong>conciliado</strong>.</p>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'conciliarTurnoSheet',
  host: { style: 'display: contents' },
})
export class ConciliarTurnoSheetComponent {
  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);
  readonly sheetData = injectSheetData<ConciliarTurnoSheetData>();

  form = this.fb.group({ nota: [''] });

  save(): Observable<CajaTurnoResponse> {
    const nota = (this.form.getRawValue().nota ?? '').trim();
    return this.cajaService.conciliar(this.sheetData.turno.id, nota ? { nota } : {});
  }
}
