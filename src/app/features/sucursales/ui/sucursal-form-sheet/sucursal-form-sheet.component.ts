import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { SucursalAdminService } from '../../data-access/sucursal-admin.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { CrearSucursalRequest, ActualizarSucursalRequest, SucursalResponse } from '../../data-access/sucursal.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface SucursalSheetData {
  sucursalId?: string;
}

@Component({
  selector: 'app-sucursal-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent],
  templateUrl: './sucursal-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'sucursalFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' },
})
export class SucursalFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sucursalService = inject(SucursalAdminService);

  public sheetData = injectSheetData<SucursalSheetData | undefined>();

  loading = signal(false);
  isEditing = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    direccion: ['', [Validators.required, Validators.maxLength(255)]],
    telefono: ['', [Validators.required, Validators.maxLength(20)]],
  });

  ngOnInit() {
    this.isEditing = !!this.sheetData?.sucursalId;
    if (this.sheetData?.sucursalId) {
      this.loading.set(true);
      this.sucursalService.obtenerPorId(this.sheetData.sucursalId).subscribe({
        next: (sucursal) => {
          this.form.patchValue({
            nombre: sucursal.nombre,
            direccion: sucursal.direccion,
            telefono: sucursal.telefono,
          });
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al obtener sucursal', err);
          this.loading.set(false);
        }
      });
    }
  }

  save(): Observable<SucursalResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();

    if (this.isEditing && this.sheetData?.sucursalId) {
      const payload: ActualizarSucursalRequest = {
        nombre: data.nombre!,
        direccion: data.direccion!,
        telefono: data.telefono!,
      };
      return this.sucursalService.actualizar(this.sheetData.sucursalId, payload);
    }

    const payload: CrearSucursalRequest = {
      nombre: data.nombre!,
      direccion: data.direccion!,
      telefono: data.telefono!,
    };
    return this.sucursalService.crear(payload);
  }
}
