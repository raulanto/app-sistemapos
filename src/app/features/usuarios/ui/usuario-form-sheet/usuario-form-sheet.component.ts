import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { UsuarioAdminService } from '../../data-access/usuario-admin.service';
import { RolAdminService } from '../../data-access/rol-admin.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';
import {
  CrearUsuarioRequest,
  EditarUsuarioRequest,
  RolResponse,
  UsuarioResponse,
} from '../../data-access/usuarios.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface UsuarioSheetData {
  usuarioId?: string;
}

@Component({
  selector: 'app-usuario-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  templateUrl: './usuario-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'usuarioFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet.
  host: { style: 'display: contents' },
})
export class UsuarioFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioAdminService);
  private rolService = inject(RolAdminService);
  public sucursalService = inject(SucursalService);

  public sheetData = injectSheetData<UsuarioSheetData | undefined>();

  loading = signal(false);
  isEditing = false;
  readonly roles = signal<RolResponse[]>([]);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rol_id: ['', Validators.required],
    sucursal_id: [''],
  });

  ngOnInit() {
    this.isEditing = !!this.sheetData?.usuarioId;

    this.rolService.listar({ page_size: 100, sort: 'nombre:asc' }).subscribe({
      next: res => this.roles.set(res.data),
      error: err => console.error('Error al cargar roles', err),
    });

    if (this.isEditing) {
      // En edición no se toca la contraseña ni el rol (endpoints propios).
      this.form.controls.password.disable();
      this.form.controls.password.clearValidators();
      this.form.controls.rol_id.disable();
      this.form.controls.rol_id.clearValidators();

      this.loading.set(true);
      this.usuarioService.obtenerPorId(this.sheetData!.usuarioId!).subscribe({
        next: usuario => {
          this.form.patchValue({
            nombre: usuario.nombre,
            email: usuario.email,
            sucursal_id: usuario.sucursal_id ?? '',
          });
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al obtener usuario', err);
          this.loading.set(false);
        },
      });
    }
  }

  save(): Observable<UsuarioResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();
    const sucursal_id = data.sucursal_id ? data.sucursal_id : null;

    if (this.isEditing && this.sheetData?.usuarioId) {
      const payload: EditarUsuarioRequest = {
        nombre: data.nombre!,
        email: data.email!,
        sucursal_id,
      };
      return this.usuarioService.actualizar(this.sheetData.usuarioId, payload);
    }

    const payload: CrearUsuarioRequest = {
      nombre: data.nombre!,
      email: data.email!,
      password: data.password!,
      rol_id: data.rol_id!,
      sucursal_id,
    };
    return this.usuarioService.crear(payload);
  }
}
