import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, min, required, validateTree } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { MovimientoService } from '../../data-access/movimiento.service';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { TransferenciaRequest } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface TransferenciaSheetData {
  productoId: string;
}

@Component({
  selector: 'app-transferencia-form-sheet',
  standalone: true,
  imports: [
    FormField,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardTextareaComponent
  ],
  templateUrl: './transferencia-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'transferenciaFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' }
})
export class TransferenciaFormSheetComponent implements OnInit {
  private movimientoService = inject(MovimientoService);
  public sucursalService = inject(SucursalService);

  public sheetData = injectSheetData<TransferenciaSheetData>();

  private readonly model = signal({
    sucursal_origen_id: '',
    sucursal_destino_id: '',
    cantidad: 0,
    motivo: '',
  });

  protected readonly transferenciaForm = form(this.model, path => {
    required(path.sucursal_origen_id, { message: 'Requerido' });
    required(path.sucursal_destino_id, { message: 'Requerido' });
    required(path.cantidad, { message: 'Requerido' });
    min(path.cantidad, 0.01, { message: 'Debe ser mayor a 0' });

    validateTree(path, ({ value, fieldTreeOf }) => {
      const { sucursal_origen_id, sucursal_destino_id } = value();
      if (sucursal_origen_id && sucursal_destino_id && sucursal_origen_id === sucursal_destino_id) {
        return {
          kind: 'sameBranch',
          message: 'La sucursal de origen y destino no pueden ser la misma.',
          fieldTree: fieldTreeOf(path.sucursal_destino_id),
        };
      }
      return undefined;
    });
  });

  ngOnInit() {
    const currentSucursalId = this.sucursalService.selectedSucursalId();
    if (currentSucursalId) {
      this.model.update(m => ({ ...m, sucursal_origen_id: currentSucursalId }));
    } else {
      const sucursales = this.sucursalService.sucursales();
      if (sucursales.length > 0) {
        this.model.update(m => ({ ...m, sucursal_origen_id: sucursales[0].id }));
      }
    }
  }

  save(): Observable<any> | void {
    const root = this.transferenciaForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();
    const payload: TransferenciaRequest = {
      producto_id: this.sheetData.productoId,
      sucursal_origen_id: data.sucursal_origen_id,
      sucursal_destino_id: data.sucursal_destino_id,
      cantidad: data.cantidad,
      motivo: data.motivo || null
    };

    return this.movimientoService.transferir(payload);
  }
}
