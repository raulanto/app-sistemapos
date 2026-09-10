import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { MovimientoService } from '../../data-access/movimiento.service';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { AplicarMovimientoRequest } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';

export interface MovimientoSheetData {
  productoId: string;
}

type TipoMovimiento = 'entrada' | 'salida' | 'ajuste_positivo' | 'ajuste_negativo' | 'merma';

@Component({
  selector: 'app-movimiento-form-sheet',
  standalone: true,
  imports: [
    FormField,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardTextareaComponent,
    ZardCheckboxComponent,
  ],
  templateUrl: './movimiento-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'movimientoFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' },
})
export class MovimientoFormSheetComponent implements OnInit {
  private movimientoService = inject(MovimientoService);
  public sucursalService = inject(SucursalService);

  public sheetData = injectSheetData<MovimientoSheetData>();

  private readonly model = signal({
    tipo: 'entrada' as TipoMovimiento,
    sucursal_id: '',
    cantidad: 0,
    referencia_tipo: 'Ajuste manual',
    costo_unitario: null as number | null,
    actualizar_costo: false,
    nuevo_precio_venta: null as number | null,
    stock_minimo: null as number | null,
    stock_maximo: null as number | null,
    motivo: '',
  });

  protected readonly movimientoForm = form(this.model, path => {
    required(path.tipo, { message: 'Selecciona el tipo.' });
    required(path.sucursal_id, { message: 'Selecciona una sucursal.' });
    required(path.cantidad, { message: 'La cantidad es obligatoria.' });
    min(path.cantidad, 0.01, { message: 'Debe ser mayor a 0.' });
    required(path.referencia_tipo, { message: 'La referencia es obligatoria.' });
    maxLength(path.referencia_tipo, 20, { message: 'Máximo 20 caracteres.' });
  });

  readonly esEntrada = computed(() => this.model().tipo === 'entrada');

  /** El backend rechaza actualizar_costo sin costo_unitario o fuera de una entrada. */
  costoUpdateInvalido(): boolean {
    const v = this.model();
    if (!v.actualizar_costo || !this.esEntrada()) return false;
    return v.costo_unitario == null || Number(v.costo_unitario) < 0;
  }

  ngOnInit() {
    const currentSucursalId = this.sucursalService.selectedSucursalId();
    if (currentSucursalId) {
      this.model.update(m => ({ ...m, sucursal_id: currentSucursalId }));
    } else {
      const sucursales = this.sucursalService.sucursales();
      if (sucursales.length > 0) {
        this.model.update(m => ({ ...m, sucursal_id: sucursales[0].id }));
      }
    }
  }

  save(): Observable<unknown> | void {
    const root = this.movimientoForm();
    if (!root.valid() || this.costoUpdateInvalido()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();
    const num = (v: number | null) => (v === null || v === undefined || (v as unknown) === '' ? null : Number(v));

    const payload: AplicarMovimientoRequest = {
      producto_id: this.sheetData.productoId,
      tipo: data.tipo,
      sucursal_id: data.sucursal_id,
      cantidad: data.cantidad,
      referencia_tipo: data.referencia_tipo,
      motivo: data.motivo || null,
    };

    const costoUnitario = num(data.costo_unitario);
    if (this.esEntrada() && costoUnitario !== null) payload.costo_unitario = costoUnitario;
    if (this.esEntrada() && data.actualizar_costo) payload.actualizar_costo = true;

    const nuevoPrecio = num(data.nuevo_precio_venta);
    if (nuevoPrecio !== null) payload.nuevo_precio_venta = nuevoPrecio;

    const stockMin = num(data.stock_minimo);
    const stockMax = num(data.stock_maximo);
    if (stockMin !== null) payload.stock_minimo = stockMin;
    if (stockMax !== null) payload.stock_maximo = stockMax;

    return this.movimientoService.aplicar(payload);
  }
}
