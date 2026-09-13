import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProveedorService } from '../../data-access/proveedor.service';
import {
  DevolucionProveedorResponse,
  RESULTADOS_DEVOLUCION,
  ResultadoDevolucion,
  TIPOS_RESOLUCION_DEVOLUCION,
  TipoResolucionDevolucion,
} from '../../data-access/proveedores.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface CerrarDevolucionSheetData {
  devolucionId: string;
}

@Component({
  selector: 'app-cerrar-devolucion-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ...ZardSelectImports],
  templateUrl: './cerrar-devolucion-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cerrarDevolucionSheet',
  host: { style: 'display: contents' },
})
export class CerrarDevolucionSheetComponent {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  readonly sheetData = injectSheetData<CerrarDevolucionSheetData>();

  readonly resultados = RESULTADOS_DEVOLUCION;
  readonly tiposResolucion = TIPOS_RESOLUCION_DEVOLUCION;

  readonly form = this.fb.group({
    resultado: ['aceptada_proveedor' as ResultadoDevolucion, Validators.required],
    tipo_resolucion: [null as TipoResolucionDevolucion | null],
  });

  readonly esAceptada = signal(true);

  constructor() {
    this.form.get('resultado')!.valueChanges.subscribe(v => this.esAceptada.set(v === 'aceptada_proveedor'));
  }

  save(): Observable<DevolucionProveedorResponse> | void {
    if (this.form.invalid || (this.esAceptada() && !this.form.get('tipo_resolucion')?.value)) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    return this.proveedorService.cerrarDevolucion(this.sheetData.devolucionId, {
      resultado: v.resultado!,
      tipo_resolucion: this.esAceptada() ? v.tipo_resolucion : null,
    });
  }
}
