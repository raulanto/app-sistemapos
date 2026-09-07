import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { CajaService } from '../../data-access/caja.service';
import { CajaTurnoResponse } from '../../data-access/ventas.models';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-abrir-caja-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent],
  template: `
    <form [formGroup]="form" class="grid min-h-0 flex-1 auto-rows-min gap-6 px-4 pb-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        Declara el efectivo con el que arranca el cajón. La sucursal se toma de tu usuario.
      </p>
      <div z-field>
        <label z-field-label for="saldo_inicial">Efectivo inicial *</label>
        <input z-input id="saldo_inicial" type="number" min="0" step="0.01" formControlName="saldo_inicial" placeholder="0.00" />
        @if (form.controls.saldo_inicial.invalid && form.controls.saldo_inicial.touched) {
          <p class="text-[0.8rem] font-medium text-destructive">Ingresa un monto válido (≥ 0).</p>
        }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'abrirCajaSheet',
  host: { style: 'display: contents' },
})
export class AbrirCajaSheetComponent {
  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);

  form = this.fb.group({
    saldo_inicial: [0, [Validators.required, Validators.min(0)]],
  });

  save(): Observable<CajaTurnoResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    return this.cajaService.abrir({ saldo_inicial: Number(this.form.getRawValue().saldo_inicial) });
  }
}
