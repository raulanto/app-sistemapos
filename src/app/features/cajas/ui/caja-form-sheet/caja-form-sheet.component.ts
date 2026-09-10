import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
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
  imports: [FormField, ...ZardFieldImports, ZardInputComponent],
  template: `
    <form class="grid min-h-0 flex-1 auto-rows-min gap-6 px-4 pb-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        Una terminal es una caja física de la sucursal. El nombre es único entre las cajas activas.
      </p>
      @let nombre = cajaForm.nombre();
      @let nombreInvalid = nombre.invalid() && nombre.touched();
      <div z-field [attr.data-invalid]="nombreInvalid || null">
        <label z-field-label for="nombre">Nombre *</label>
        <input z-input id="nombre" type="text" maxlength="50" placeholder="Ej. Caja 2"
          [formField]="cajaForm.nombre" [attr.aria-invalid]="nombreInvalid || null" />
        @if (nombreInvalid) {
          <z-field-error [zErrors]="nombre.errors()" />
        }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cajaFormSheet',
  host: { style: 'display: contents' },
})
export class CajaFormSheetComponent {
  private cajaService = inject(CajaService);
  readonly sheetData = injectSheetData<CajaFormSheetData | undefined>();

  private readonly model = signal({ nombre: this.sheetData?.caja?.nombre ?? '' });

  protected readonly cajaForm = form(this.model, path => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 50, { message: 'Máximo 50 caracteres.' });
  });

  save(): Observable<CajaResponse> | void {
    const root = this.cajaForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }
    const nombre = this.model().nombre.trim();
    const caja = this.sheetData?.caja;
    return caja ? this.cajaService.renombrarCaja(caja.id, { nombre }) : this.cajaService.crearCaja({ nombre });
  }
}
