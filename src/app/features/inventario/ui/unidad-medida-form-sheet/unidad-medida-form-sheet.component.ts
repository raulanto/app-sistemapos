import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, max, maxLength, min, required } from '@angular/forms/signals';
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
  imports: [FormField, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  templateUrl: './unidad-medida-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'unidadMedidaFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' },
})
export class UnidadMedidaFormSheetComponent {
  private unidadMedidaService = inject(UnidadMedidaService);

  private readonly model = signal({
    codigo: '',
    nombre: '',
    tipo_magnitud: 'conteo' as TipoMagnitud,
    decimales: 0,
  });

  protected readonly umForm = form(this.model, path => {
    required(path.codigo, { message: 'Obligatorio (1–20 caracteres).' });
    maxLength(path.codigo, 20, { message: 'Máximo 20 caracteres.' });
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 60, { message: 'Máximo 60 caracteres.' });
    required(path.tipo_magnitud, { message: 'Selecciona el tipo.' });
    required(path.decimales, { message: 'Obligatorio.' });
    min(path.decimales, 0, { message: 'Mínimo 0.' });
    max(path.decimales, 6, { message: 'Máximo 6.' });
  });

  save(): Observable<UnidadMedidaResponse> | void {
    const root = this.umForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();
    const payload: CrearUnidadMedidaRequest = {
      codigo: data.codigo,
      nombre: data.nombre,
      tipo_magnitud: data.tipo_magnitud,
      decimales: data.decimales ?? 0,
    };
    return this.unidadMedidaService.crear(payload);
  }
}
