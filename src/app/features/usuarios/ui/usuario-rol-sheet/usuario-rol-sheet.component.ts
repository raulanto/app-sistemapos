import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { UsuarioAdminService } from '../../data-access/usuario-admin.service';
import { RolAdminService } from '../../data-access/rol-admin.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { RolResponse, UsuarioResponse } from '../../data-access/usuarios.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface UsuarioRolSheetData {
  usuarioId: string;
  rolActualId: string;
  nombre: string;
}

@Component({
  selector: 'app-usuario-rol-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ...ZardSelectImports],
  templateUrl: './usuario-rol-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'usuarioRolSheet',
  host: { style: 'display: contents' },
})
export class UsuarioRolSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioAdminService);
  private rolService = inject(RolAdminService);

  public sheetData = injectSheetData<UsuarioRolSheetData>();

  readonly roles = signal<RolResponse[]>([]);

  form = this.fb.group({
    rol_id: ['', Validators.required],
  });

  ngOnInit() {
    this.form.patchValue({ rol_id: this.sheetData?.rolActualId ?? '' });
    this.rolService.listar({ page_size: 100, sort: 'nombre:asc' }).subscribe({
      next: res => this.roles.set(res.data),
      error: err => console.error('Error al cargar roles', err),
    });
  }

  save(): Observable<UsuarioResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const rol_id = this.form.getRawValue().rol_id!;
    if (rol_id === this.sheetData?.rolActualId) return;
    return this.usuarioService.cambiarRol(this.sheetData!.usuarioId, { rol_id });
  }
}
