import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProductoService } from '../../data-access/producto.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { AgregarUnidadRequest, ActualizarUnidadRequest, UnidadResponse } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface UnidadSheetData {
  productoId: string;
  unidad?: UnidadResponse;
}

@Component({
  selector: 'app-unidad-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ...ZardFieldImports,
    ZardInputComponent
  ],
  templateUrl: './unidad-form-sheet.component.html',
  exportAs: 'unidadFormSheet'
})
export class UnidadFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  
  public sheetData = injectSheetData<UnidadSheetData>();
  
  isEditing = false;

  form = this.fb.group({
    nombre: ['', Validators.required],
    factor: [2, [Validators.required, Validators.min(1.001)]], // Factor > 1
    precio_venta: [0, [Validators.required, Validators.min(0)]],
    codigo_barras: ['']
  });

  ngOnInit() {
    this.isEditing = !!this.sheetData?.unidad;
    
    if (this.isEditing) {
      this.form.patchValue({
        nombre: this.sheetData!.unidad!.nombre,
        factor: Number(this.sheetData!.unidad!.factor),
        precio_venta: Number(this.sheetData!.unidad!.precio_venta),
        codigo_barras: this.sheetData!.unidad!.codigo_barras || ''
      });
    }
  }

  save(): Observable<UnidadResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const data = this.form.getRawValue();
    
    if (this.isEditing) {
      const payload: ActualizarUnidadRequest = {
        nombre: data.nombre!,
        factor: data.factor!,
        precio_venta: data.precio_venta!,
        codigo_barras: data.codigo_barras || null
      };
      return this.productoService.actualizarUnidad(this.sheetData!.productoId, this.sheetData!.unidad!.id, payload);
    } else {
      const payload: AgregarUnidadRequest = {
        nombre: data.nombre!,
        factor: data.factor!,
        precio_venta: data.precio_venta!,
        codigo_barras: data.codigo_barras || null
      };
      return this.productoService.agregarUnidad(this.sheetData!.productoId, payload);
    }
  }
}
