import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { RecursoService } from '../../data-access/services/recurso.service';
import { RecursoResponse } from '../../data-access/agenda.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface RecursoSheetData {
  recurso?: RecursoResponse;
}

@Component({
  selector: 'app-recurso-form-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardInputComponent],
  templateUrl: './recurso-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'recursoFormSheet',
  host: { style: 'display: contents' },
})
export class RecursoFormSheetComponent {
  private recursoService = inject(RecursoService);
  readonly sheetData = injectSheetData<RecursoSheetData | undefined>();

  readonly isEditing = !!this.sheetData?.recurso;

  private readonly model = signal({
    nombre: this.sheetData?.recurso?.nombre ?? '',
    tipo: this.sheetData?.recurso?.tipo ?? '',
  });

  protected readonly recursoForm = form(this.model, path => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 80, { message: 'Máximo 80 caracteres.' });
  });

  save(): Observable<RecursoResponse> | void {
    const root = this.recursoForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }
    const d = this.model();
    if (this.isEditing && this.sheetData?.recurso) {
      return this.recursoService.renombrarRecurso(this.sheetData.recurso.id, { nombre: d.nombre });
    }
    return this.recursoService.crearRecurso({ nombre: d.nombre, tipo: d.tipo || null });
  }
}
