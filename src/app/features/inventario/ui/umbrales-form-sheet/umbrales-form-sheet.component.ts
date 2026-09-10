import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, min, required, validate } from '@angular/forms/signals';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, delay } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { ProductoService } from '../../data-access/producto.service';
import { MovimientoService } from '../../data-access/movimiento.service';
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
    FormField,
    ...ZardFieldImports,
    ZardInputComponent
  ],
  template: `
    <form class="grid min-h-0 flex-1 auto-rows-min gap-6 px-4 pb-4 overflow-y-auto">
      <div class="grid grid-cols-2 gap-4">
        @let stockMin = umbralesForm.stock_minimo();
        @let stockMinInvalid = stockMin.invalid() && stockMin.touched();
        <div z-field [attr.data-invalid]="stockMinInvalid || null">
          <label z-field-label for="stock_minimo">Stock Mínimo *</label>
          <input z-input id="stock_minimo" type="number" placeholder="0"
            [formField]="umbralesForm.stock_minimo" [attr.aria-invalid]="stockMinInvalid || null">
          @if (stockMinInvalid) {
            <z-field-error [zErrors]="stockMin.errors()" />
          }
        </div>
        @let stockMax = umbralesForm.stock_maximo();
        @let stockMaxInvalid = stockMax.invalid() && stockMax.touched();
        <div z-field [attr.data-invalid]="stockMaxInvalid || null">
          <label z-field-label for="stock_maximo">Stock Máximo (Opcional)</label>
          <input z-input id="stock_maximo" type="number" placeholder="0"
            [formField]="umbralesForm.stock_maximo" [attr.aria-invalid]="stockMaxInvalid || null">
          @if (stockMaxInvalid) {
            <z-field-error [zErrors]="stockMax.errors()" />
          }
        </div>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'umbralesFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' }
})
export class UmbralesFormSheetComponent implements OnInit {
  private productoService = inject(ProductoService);
  private movimientoService = inject(MovimientoService);

  public sheetData = injectSheetData<UmbralesSheetData>();

  private readonly model = signal({ stock_minimo: 0, stock_maximo: null as number | null });

  protected readonly umbralesForm = form(this.model, path => {
    required(path.stock_minimo, { message: 'Obligatorio.' });
    min(path.stock_minimo, 0, { message: 'No puede ser negativo.' });
    validate(path.stock_maximo, ({ value }) => {
      const v = value();
      return v != null && v < 0 ? { kind: 'min', message: 'No puede ser negativo.' } : undefined;
    });
  });

  ngOnInit() {
    this.model.set({
      stock_minimo: this.sheetData.stockMinimo || 0,
      stock_maximo: this.sheetData.stockMaximo || null
    });
  }

  save(): Observable<any> | void {
    const root = this.umbralesForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();
    const request$ = this.productoService.actualizarUmbrales(
      this.sheetData.productoId,
      this.sheetData.sucursalId,
      {
        stock_minimo: data.stock_minimo,
        stock_maximo: data.stock_maximo || undefined
      }
    );

    return request$.pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.error?.error?.code === 'NOT_FOUND') {
          // Si no existe la existencia, forzamos su creación con un ajuste_positivo a 0
          return this.movimientoService.aplicar({
            producto_id: this.sheetData.productoId,
            sucursal_id: this.sheetData.sucursalId,
            tipo: 'ajuste_positivo',
            cantidad_final: 0,
            referencia_tipo: 'inventario_inicial',
            motivo: 'Inicialización automática de registro de existencia'
          }).pipe(
            delay(500),
            switchMap(() => request$)
          );
        }
        return throwError(() => err);
      })
    );
  }
}
