import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { MarcaService } from '../../data-access/services/marca.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import {
  MarcaResponse,
  CrearMarcaRequest,
  ActualizarMarcaRequest,
} from '../../data-access/models/marca.model';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface MarcaSheetData {
  marca?: MarcaResponse;
}

@Component({
  selector: 'app-marca-form-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardInputComponent],
  templateUrl: './marca-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'marcaFormSheet',
  host: { style: 'display: contents' },
})
export class MarcaFormSheetComponent implements OnInit {
  private marcaService = inject(MarcaService);

  public sheetData = injectSheetData<MarcaSheetData | undefined>();
  isEditing = false;
  readonly submitting = signal(false);

  private readonly model = signal({ nombre: '' });

  protected readonly marcaForm = form(this.model, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 100, { message: 'Máximo 100 caracteres.' });
  });

  /** Indica si el formulario es válido y se puede enviar */
  readonly isValid = computed(() => {
    const nombreVal = this.model().nombre.trim();
    return nombreVal.length > 0 && nombreVal.length <= 100 && !this.submitting();
  });

  ngOnInit() {
    const m = this.sheetData?.marca;
    this.isEditing = !!m;

    this.model.set({
      nombre: m?.nombre ?? '',
    });
  }

  save(): Observable<MarcaResponse> | void {
    if (this.submitting()) {
      return;
    }

    const root = this.marcaForm();
    if (!root.valid() || !this.model().nombre.trim()) {
      root.markAsTouched();
      return;
    }

    this.submitting.set(true);
    const d = this.model();
    const nombreClean = d.nombre.trim();

    let req$: Observable<MarcaResponse>;

    if (this.isEditing && this.sheetData?.marca) {
      const payload: ActualizarMarcaRequest = {
        nombre: nombreClean,
      };
      req$ = this.marcaService.actualizar(this.sheetData.marca.id, payload);
    } else {
      const payload: CrearMarcaRequest = { nombre: nombreClean };
      req$ = this.marcaService.crear(payload);
    }

    return req$.pipe(
      tap({
        error: () => this.submitting.set(false),
      }),
    );
  }
}

