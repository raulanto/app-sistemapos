import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

function differentBranchValidator(control: AbstractControl): ValidationErrors | null {
  const origin = control.get('sucursal_origen_id')?.value;
  const destination = control.get('sucursal_destino_id')?.value;
  if (origin && destination && origin === destination) {
    return { sameBranch: true };
  }
  return null;
}

@Component({
  selector: 'app-transferencia-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardTextareaComponent
  ],
  templateUrl: './transferencia-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'transferenciaFormSheet'
})
export class TransferenciaFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoService);
  public sucursalService = inject(SucursalService);
  
  public sheetData = injectSheetData<TransferenciaSheetData>();

  form = this.fb.group({
    sucursal_origen_id: ['', Validators.required],
    sucursal_destino_id: ['', Validators.required],
    cantidad: [0, [Validators.required, Validators.min(0.01)]],
    motivo: ['']
  }, { validators: differentBranchValidator });

  ngOnInit() {
    const currentSucursalId = this.sucursalService.selectedSucursalId();
    if (currentSucursalId) {
      this.form.patchValue({ sucursal_origen_id: currentSucursalId });
    } else {
      const sucursales = this.sucursalService.sucursales();
      if (sucursales.length > 0) {
        this.form.patchValue({ sucursal_origen_id: sucursales[0].id });
      }
    }
  }

  save(): Observable<any> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const data = this.form.value;
    const payload: TransferenciaRequest = {
      producto_id: this.sheetData.productoId,
      sucursal_origen_id: data.sucursal_origen_id!,
      sucursal_destino_id: data.sucursal_destino_id!,
      cantidad: data.cantidad!,
      motivo: data.motivo || null
    };

    return this.movimientoService.transferir(payload);
  }
}
