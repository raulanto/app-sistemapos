import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { SucursalService } from '@/core/sucursal/sucursal.service';
import { ZardFieldImports } from '@/shared/components/field/field.imports';
import { ZardSelectImports } from '@/shared/components/select/select.imports';
import { ZardTextareaComponent } from '@/shared/components/textarea/textarea.component';

import { ReporteService } from '../../data-access/reporte.service';
import { CrearReporteProgramadoRequest, FormatoExport, FrecuenciaReporteProgramado, ReporteProgramadoResponse, TipoReporteProgramable } from '../../data-access/reporte.models';

/** Alta de un reporte programado (envío periódico por correo). */
@Component({
  selector: 'app-reporte-programado-form-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ...ZardSelectImports, ZardTextareaComponent],
  templateUrl: './reporte-programado-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'reporteProgramadoFormSheet',
  host: { style: 'display: contents' },
})
export class ReporteProgramadoFormSheetComponent {
  private readonly reporteService = inject(ReporteService);
  readonly sucursalService = inject(SucursalService);

  private readonly model = signal({
    tipo_reporte: 'ventas' as TipoReporteProgramable,
    frecuencia: 'diaria' as FrecuenciaReporteProgramado,
    formato_salida: 'pdf' as FormatoExport,
    destinatarios: '',
    sucursal_id: '',
  });

  protected readonly programadoForm = form(this.model, path => {
    required(path.destinatarios, { message: 'Captura al menos un correo destinatario.' });
  });

  save(): Observable<ReporteProgramadoResponse> | void {
    const root = this.programadoForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();
    const destinatarios = data.destinatarios
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (!destinatarios.length) {
      root.markAsTouched();
      return;
    }

    const payload: CrearReporteProgramadoRequest = {
      tipo_reporte: data.tipo_reporte,
      frecuencia: data.frecuencia,
      formato_salida: data.formato_salida,
      destinatarios,
      sucursal_id: data.sucursal_id || null,
    };
    return this.reporteService.programadosCrear(payload);
  }
}
