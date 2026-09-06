import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent],
  templateUrl: './rol-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'rolFormSheet',
  host: { style: 'display: contents' },
})
export class RolFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolService = inject(RolAdminService);

  public sheetData = injectSheetData<RolSheetData | undefined>();

  isEditing = false;

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: ['', [Validators.maxLength(255)]],
  });

  ngOnInit() {
    const rol = this.sheetData?.rol;
    this.isEditing = !!rol;
    if (!rol) return;

    this.form.patchValue({
      codigo: rol.codigo ?? '',
      nombre: rol.nombre,
      descripcion: rol.descripcion,
    });
    // El código es inmutable una vez creado el rol.
    this.form.controls.codigo.disable();
  }

  save(): Observable<RolResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();

    if (this.isEditing && this.sheetData?.rol) {
      const payload: EditarRolRequest = {
        nombre: data.nombre!,
        descripcion: data.descripcion || '',
      };
      return this.rolService.actualizar(this.sheetData.rol.id, payload);
    }

    const payload: CrearRolRequest = {
      codigo: data.codigo!,
      nombre: data.nombre!,
      descripcion: data.descripcion || '',
    };
    return this.rolService.crear(payload);
  }
}
