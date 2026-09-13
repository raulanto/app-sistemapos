import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { AgendaService } from '../../data-access/agenda.service';
import { CitaResponse } from '../../data-access/agenda.models';
import { UsuarioResponse } from '../../../usuarios/data-access/models/usuario.model';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface AsignarManualSheetData {
  citaId: string;
  usuarios: UsuarioResponse[];
}

@Component({
  selector: 'app-asignar-manual-sheet',
  standalone: true,
  imports: [FormsModule, ...ZardFieldImports, ...ZardSelectImports],
  templateUrl: './asignar-manual-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'asignarManualSheet',
  host: { style: 'display: contents' },
})
export class AsignarManualSheetComponent {
  private agendaService = inject(AgendaService);
  readonly sheetData = injectSheetData<AsignarManualSheetData>();

  readonly usuarios = this.sheetData.usuarios;
  readonly empleadoId = signal('');

  save(): Observable<CitaResponse> | void {
    if (!this.empleadoId()) return;
    return this.agendaService.asignarManual(this.sheetData.citaId, { empleado_id: this.empleadoId() });
  }
}
