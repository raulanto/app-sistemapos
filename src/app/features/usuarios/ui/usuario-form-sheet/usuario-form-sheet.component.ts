import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { disabled, email, form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
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
  imports: [FormField, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  templateUrl: './usuario-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'usuarioFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet.
  host: { style: 'display: contents' },
})
export class UsuarioFormSheetComponent implements OnInit {
  private usuarioService = inject(UsuarioAdminService);
  private rolService = inject(RolAdminService);
  public sucursalService = inject(SucursalService);

  public sheetData = injectSheetData<UsuarioSheetData | undefined>();

  loading = signal(false);
  isEditing = false;
  readonly roles = signal<RolResponse[]>([]);

  private readonly model = signal({
    nombre: '',
    email: '',
    password: '',
    rol_id: '',
    sucursal_id: '',
  });

  protected readonly usuarioForm = form(this.model, path => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 100, { message: 'Máximo 100 caracteres.' });
    required(path.email, { message: 'Ingresa un correo válido.' });
    email(path.email, { message: 'Ingresa un correo válido.' });
    // En edición no se toca la contraseña ni el rol (endpoints propios): deshabilitados no validan.
    required(path.password, { message: 'La contraseña debe tener al menos 8 caracteres.' });
    minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
    disabled(path.password, () => !!this.sheetData?.usuarioId);
    required(path.rol_id, { message: 'Elige un rol.' });
    disabled(path.rol_id, () => !!this.sheetData?.usuarioId);
  });

  ngOnInit() {
    this.isEditing = !!this.sheetData?.usuarioId;

    this.rolService.listar({ page_size: 100, sort: 'nombre:asc' }).subscribe({
      next: res => this.roles.set(res.data),
      error: err => console.error('Error al cargar roles', err),
    });

    if (this.isEditing) {
      this.loading.set(true);
      this.usuarioService.obtenerPorId(this.sheetData!.usuarioId!).subscribe({
        next: usuario => {
          this.model.set({
            nombre: usuario.nombre,
            email: usuario.email,
            password: '',
            rol_id: '',
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
    const root = this.usuarioForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();
    const sucursal_id = data.sucursal_id ? data.sucursal_id : null;

    if (this.isEditing && this.sheetData?.usuarioId) {
      const payload: EditarUsuarioRequest = {
        nombre: data.nombre,
        email: data.email,
        sucursal_id,
      };
      return this.usuarioService.actualizar(this.sheetData.usuarioId, payload);
    }

    const payload: CrearUsuarioRequest = {
      nombre: data.nombre,
      email: data.email,
      password: data.password,
      rol_id: data.rol_id,
      sucursal_id,
    };
    return this.usuarioService.crear(payload);
  }
}
