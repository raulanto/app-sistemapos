import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
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
  imports: [FormField, ...ZardFieldImports, ...ZardSelectImports],
  templateUrl: './usuario-rol-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'usuarioRolSheet',
  host: { style: 'display: contents' },
})
export class UsuarioRolSheetComponent implements OnInit {
  private usuarioService = inject(UsuarioAdminService);
  private rolService = inject(RolAdminService);

  public sheetData = injectSheetData<UsuarioRolSheetData>();

  readonly roles = signal<RolResponse[]>([]);

  private readonly model = signal({ rol_id: '' });

  protected readonly rolForm = form(this.model, path => {
    required(path.rol_id, { message: 'Elige un rol.' });
  });

  ngOnInit() {
    this.model.set({ rol_id: this.sheetData?.rolActualId ?? '' });
    this.rolService.listar({ page_size: 100, sort: 'nombre:asc' }).subscribe({
      next: res => this.roles.set(res.data),
      error: err => console.error('Error al cargar roles', err),
    });
  }

  save(): Observable<UsuarioResponse> | void {
    const root = this.rolForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }
    const rol_id = this.model().rol_id;
    if (rol_id === this.sheetData?.rolActualId) return;
    return this.usuarioService.cambiarRol(this.sheetData!.usuarioId, { rol_id });
  }
}
