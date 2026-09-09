import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { CajaService } from '../../../ventas/data-access/caja.service';
import { CajaResponse } from '../../../ventas/data-access/ventas.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface CajaFormSheetData {
  caja?: CajaResponse;
}

@Component({
  selector: 'app-caja-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent],
  template: `
    <form [formGroup]="form" class="grid min-h-0 flex-1 auto-rows-min gap-6 px-4 pb-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        Una terminal es una caja física de la sucursal. El nombre es único entre las cajas activas.
      </p>
      <div z-field>
        <label z-field-label for="nombre">Nombre *</label>
        <input z-input id="nombre" type="text" formControlName="nombre" maxlength="50" placeholder="Ej. Caja 2" />
        @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
          <p class="text-[0.8rem] font-medium text-destructive">El nombre es obligatorio.</p>
        }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cajaFormSheet',
  host: { style: 'display: contents' },
})
export class CajaFormSheetComponent {
  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);
  readonly sheetData = injectSheetData<CajaFormSheetData | undefined>();

  form = this.fb.group({
    nombre: [this.sheetData?.caja?.nombre ?? '', [Validators.required, Validators.maxLength(50)]],
  });

  save(): Observable<CajaResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.getRawValue().nombre!.trim();
    const caja = this.sheetData?.caja;
    return caja ? this.cajaService.renombrarCaja(caja.id, { nombre }) : this.cajaService.crearCaja({ nombre });
  }
}
