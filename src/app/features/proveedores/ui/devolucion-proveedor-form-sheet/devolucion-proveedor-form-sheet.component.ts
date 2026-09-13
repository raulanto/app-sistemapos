import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProveedorService } from '../../data-access/proveedor.service';
import { DevolucionProveedorResponse, RecepcionProveedorResponse } from '../../data-access/proveedores.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface DevolucionProveedorSheetData {
  recepcion: RecepcionProveedorResponse;
  /** producto_id -> nombre, para mostrar en cada línea. */
  nombresProducto: Record<string, string>;
}

@Component({
  selector: 'app-devolucion-proveedor-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ZardCheckboxComponent, ZardTextareaComponent],
  templateUrl: './devolucion-proveedor-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'devolucionProveedorFormSheet',
  host: { style: 'display: contents' },
})
export class DevolucionProveedorFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  readonly sheetData = injectSheetData<DevolucionProveedorSheetData>();

  /** Sólo las líneas marcadas para devolución con algo defectuoso pendiente son elegibles. */
  readonly elegibles = () =>
    this.sheetData.recepcion.lineas.filter(l => l.accion_defecto === 'devolucion' && Number(l.cantidad_defectuosa) > 0);

  readonly form = this.fb.group({
    notas: [''],
    lineas: this.fb.array<ReturnType<typeof this.filaDe>>([]),
  });

  get lineas() {
    return this.form.get('lineas') as FormArray;
  }

  nombreProducto(id: string): string {
    return this.sheetData.nombresProducto[id] ?? id.slice(0, 8);
  }

  private filaDe(recepcionDetalleId: string, disponible: number) {
    return this.fb.group({
      incluir: [true],
      recepcion_detalle_id: [recepcionDetalleId],
      disponible: [disponible],
      cantidad: [disponible, [Validators.required, Validators.min(0.01), Validators.max(disponible)]],
    });
  }

  ngOnInit() {
    for (const l of this.elegibles()) {
      this.lineas.push(this.filaDe(l.id, Number(l.cantidad_defectuosa)));
    }
  }

  save(): Observable<DevolucionProveedorResponse> | void {
    const seleccionadas = this.lineas.controls.filter(g => g.get('incluir')?.value);
    if (seleccionadas.length === 0 || seleccionadas.some(g => g.invalid)) {
      this.form.markAllAsTouched();
      return;
    }
    return this.proveedorService.crearDevolucion({
      proveedor_id: this.sheetData.recepcion.proveedor_id,
      recepcion_id: this.sheetData.recepcion.id,
      lineas: seleccionadas.map(g => ({
        recepcion_detalle_id: g.get('recepcion_detalle_id')!.value,
        cantidad: Number(g.get('cantidad')!.value),
      })),
      notas: this.form.get('notas')?.value?.trim() || null,
    });
  }
}
