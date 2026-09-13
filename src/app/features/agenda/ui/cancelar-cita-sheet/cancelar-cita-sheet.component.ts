import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { CitaService } from '../../data-access/services/cita.service';
import { CitaResponse } from '../../data-access/agenda.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface CancelarCitaSheetData {
  citaId: string;
}

@Component({
  selector: 'app-cancelar-cita-sheet',
  standalone: true,
  imports: [FormsModule, ...ZardFieldImports, ZardTextareaComponent],
  templateUrl: './cancelar-cita-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cancelarCitaSheet',
  host: { style: 'display: contents' },
})
export class CancelarCitaSheetComponent {
  private citaService = inject(CitaService);
  readonly sheetData = injectSheetData<CancelarCitaSheetData>();

  readonly motivo = signal('');

  save(): Observable<CitaResponse> {
    return this.citaService.cancelar(this.sheetData.citaId, { motivo: this.motivo().trim() || null });
  }
}
