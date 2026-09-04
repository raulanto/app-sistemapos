import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';

export interface MovimientoSheetData {
  productoId: string;
}

type TipoMovimiento = 'entrada' | 'salida' | 'ajuste_positivo' | 'ajuste_negativo' | 'merma';

@Component({
  selector: 'app-movimiento-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardTextareaComponent,
    ZardCheckboxComponent,
  ],
  templateUrl: './movimiento-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'movimientoFormSheet',
})
export class MovimientoFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoService);
  private destroyRef = inject(DestroyRef);
  public sucursalService = inject(SucursalService);

  public sheetData = injectSheetData<MovimientoSheetData>();

  readonly tipo = signal<TipoMovimiento>('entrada');
  readonly esEntrada = computed(() => this.tipo() === 'entrada');

  form = this.fb.group({
    tipo: ['entrada' as TipoMovimiento, Validators.required],
    sucursal_id: ['', Validators.required],
    cantidad: [0, [Validators.required, Validators.min(0.01)]],
    referencia_tipo: ['Ajuste manual', [Validators.required, Validators.maxLength(20)]],
    costo_unitario: [null as number | null],
    actualizar_costo: [false],
    nuevo_precio_venta: [null as number | null],
    stock_minimo: [null as number | null],
    stock_maximo: [null as number | null],
    motivo: [''],
  });

  /** El backend rechaza actualizar_costo sin costo_unitario o fuera de una entrada. */
  costoUpdateInvalido(): boolean {
    const v = this.form.getRawValue();
    return !!v.actualizar_costo && (!this.esEntrada() || v.costo_unitario == null || Number(v.costo_unitario) < 0);
  }

  ngOnInit() {
    this.form.controls.tipo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => {
      this.tipo.set((v as TipoMovimiento) ?? 'entrada');
      if (v !== 'entrada' && this.form.controls.actualizar_costo.value) {
        this.form.controls.actualizar_costo.setValue(false);
      }
    });

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

  save(): Observable<unknown> | void {
    if (this.form.invalid || this.costoUpdateInvalido()) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();
    const num = (v: number | null) => (v === null || v === undefined || (v as unknown) === '' ? null : Number(v));

    const payload: AplicarMovimientoRequest = {
      producto_id: this.sheetData.productoId,
      tipo: data.tipo!,
      sucursal_id: data.sucursal_id!,
      cantidad: data.cantidad!,
      referencia_tipo: data.referencia_tipo!,
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
