import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { UnidadMedidaService } from '../../data-access/unidad-medida.service';
import { CrearUnidadMedidaRequest, TipoMagnitud, UnidadMedidaResponse } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

/**
 * Alta rápida de una unidad de medida (kg, l, ml, pza, hora, …) cuando la que se
 * necesita todavía no existe en el catálogo. Se abre desde el formulario de producto.
 */
@Component({
  selector: 'app-unidad-medida-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  templateUrl: './unidad-medida-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'unidadMedidaFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' },
})
export class UnidadMedidaFormSheetComponent {
  private fb = inject(FormBuilder);
  private unidadMedidaService = inject(UnidadMedidaService);

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    tipo_magnitud: ['conteo' as TipoMagnitud, Validators.required],
    decimales: [0, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  save(): Observable<UnidadMedidaResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();
    const payload: CrearUnidadMedidaRequest = {
      codigo: data.codigo!,
      nombre: data.nombre!,
      tipo_magnitud: data.tipo_magnitud!,
      decimales: data.decimales ?? 0,
    };
    return this.unidadMedidaService.crear(payload);
  }
}
