import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { MovimientoService } from '../../data-access/movimiento.service';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { AplicarMovimientoRequest } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface MovimientoSheetData {
  productoId: string;
}

@Component({
  selector: 'app-movimiento-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardTextareaComponent
  ],
  templateUrl: './movimiento-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'movimientoFormSheet'
})
export class MovimientoFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoService);
  public sucursalService = inject(SucursalService);
  
  public sheetData = injectSheetData<MovimientoSheetData>();

  form = this.fb.group({
    tipo: ['entrada', Validators.required],
    sucursal_id: ['', Validators.required],
    cantidad: [0, [Validators.required, Validators.min(0.01)]],
    referencia_tipo: ['Ajuste manual', Validators.required],
    motivo: ['']
  });

  ngOnInit() {
    const currentSucursalId = this.sucursalService.selectedSucursalId();
    if (currentSucursalId) {
      this.form.patchValue({ sucursal_id: currentSucursalId });
    } else {
      const sucursales = this.sucursalService.sucursales();
      if (sucursales.length > 0) {
        this.form.patchValue({ sucursal_id: sucursales[0].id });
      }
    }
  }

  save(): Observable<any> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const data = this.form.value as Partial<AplicarMovimientoRequest>;
    const payload: AplicarMovimientoRequest = {
      producto_id: this.sheetData.productoId,
      tipo: data.tipo as 'entrada' | 'salida' | 'ajuste_positivo' | 'ajuste_negativo' | 'merma',
      sucursal_id: data.sucursal_id!,
      cantidad: data.cantidad!,
      referencia_tipo: data.referencia_tipo!,
      motivo: data.motivo || null
    };

    return this.movimientoService.aplicar(payload);
  }
}
