import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProductoService } from '../../data-access/producto.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface UmbralesSheetData {
  productoId: string;
  sucursalId: string;
  stockMinimo: number;
  stockMaximo?: number;
}

@Component({
  selector: 'app-umbrales-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ...ZardFieldImports,
    ZardInputComponent
  ],
  template: `
    <form [formGroup]="form" class="grid flex-1 auto-rows-min gap-6 px-4 pb-24 overflow-y-auto">
      <div class="grid grid-cols-1 gap-4">
        <div z-field>
          <label z-field-label for="stock_minimo">Stock Mínimo *</label>
          <input z-input id="stock_minimo" type="number" formControlName="stock_minimo" min="0" placeholder="0">
        </div>
        <div z-field>
          <label z-field-label for="stock_maximo">Stock Máximo (Opcional)</label>
          <input z-input id="stock_maximo" type="number" formControlName="stock_maximo" min="0" placeholder="0">
        </div>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'umbralesFormSheet'
})
export class UmbralesFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  
  public sheetData = injectSheetData<UmbralesSheetData>();

  form = this.fb.group({
    stock_minimo: [0, [Validators.required, Validators.min(0)]],
    stock_maximo: [null as number | null, [Validators.min(0)]]
  });

  ngOnInit() {
    this.form.patchValue({
      stock_minimo: this.sheetData.stockMinimo || 0,
      stock_maximo: this.sheetData.stockMaximo || null
    });
  }

  save(): Observable<any> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const data = this.form.value;
    return this.productoService.actualizarUmbrales(
      this.sheetData.productoId,
      this.sheetData.sucursalId,
      {
        stock_minimo: data.stock_minimo!,
        stock_maximo: data.stock_maximo || undefined
      }
    );
  }
}
