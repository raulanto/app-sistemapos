import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { disabled, form, FormField, maxLength, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { RolAdminService } from '../../data-access/rol-admin.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { CrearRolRequest, EditarRolRequest, RolResponse } from '../../data-access/usuarios.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface RolSheetData {
  rol?: RolResponse;
}

@Component({
  selector: 'app-rol-form-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardInputComponent],
  templateUrl: './rol-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'rolFormSheet',
  host: { style: 'display: contents' },
})
export class RolFormSheetComponent implements OnInit {
  private rolService = inject(RolAdminService);

  public sheetData = injectSheetData<RolSheetData | undefined>();

  isEditing = false;

  private readonly model = signal({ codigo: '', nombre: '', descripcion: '' });

  protected readonly rolForm = form(this.model, path => {
    required(path.codigo, { message: 'El código es obligatorio.' });
    maxLength(path.codigo, 50, { message: 'Máximo 50 caracteres.' });
    // El código es inmutable una vez creado el rol: deshabilitado no valida.
    disabled(path.codigo, () => !!this.sheetData?.rol);
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 50, { message: 'Máximo 50 caracteres.' });
    maxLength(path.descripcion, 255, { message: 'Máximo 255 caracteres.' });
  });

  ngOnInit() {
    const rol = this.sheetData?.rol;
    this.isEditing = !!rol;
    if (!rol) return;

    this.model.set({
      codigo: rol.codigo ?? '',
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
    });
  }

  save(): Observable<RolResponse> | void {
    const root = this.rolForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();

    if (this.isEditing && this.sheetData?.rol) {
      const payload: EditarRolRequest = {
        nombre: data.nombre,
        descripcion: data.descripcion || '',
      };
      return this.rolService.actualizar(this.sheetData.rol.id, payload);
    }

    const payload: CrearRolRequest = {
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion || '',
    };
    return this.rolService.crear(payload);
  }
}
