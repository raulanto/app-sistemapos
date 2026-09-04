import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProductoService } from '../../data-access/producto.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { AgregarUnidadRequest, ActualizarUnidadRequest, UnidadResponse } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface UnidadSheetData {
  productoId: string;
  /** Unidad de medida del producto padre, para textos de ayuda (ej. "reja"). */
  unidadBase?: string;
  unidad?: UnidadResponse;
}

type ModoEquivalencia = 'unidades_por_base' | 'factor';

/** Valida que el campo de equivalencia activo tenga un valor > 0. */
function equivalenciaValidator(control: AbstractControl): ValidationErrors | null {
  const modo = control.get('modo')?.value as ModoEquivalencia;
  const campo = modo === 'factor' ? 'factor' : 'unidades_por_base';
  const valor = Number(control.get(campo)?.value);
  return Number.isFinite(valor) && valor > 0 ? null : { equivalencia: true };
}

@Component({
  selector: 'app-unidad-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  templateUrl: './unidad-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'unidadFormSheet',
})
export class UnidadFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private destroyRef = inject(DestroyRef);

  public sheetData = injectSheetData<UnidadSheetData>();

  isEditing = false;
  private originalCodigoBarras: string | null = null;

  form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      unidad_medida: ['pieza', [Validators.required, Validators.maxLength(20)]],
      modo: ['unidades_por_base' as ModoEquivalencia, Validators.required],
      unidades_por_base: [6 as number | null],
      factor: [null as number | null],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      codigo_barras: [''],
    },
    { validators: equivalenciaValidator },
  );

  readonly modo = signal<ModoEquivalencia>('unidades_por_base');
  readonly unidadBase = computed(() => this.sheetData?.unidadBase?.trim() || 'unidad base');

  ngOnInit() {
    this.form.controls.modo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.modo.set((v as ModoEquivalencia) ?? 'unidades_por_base'));

    const unidad = this.sheetData?.unidad;
    this.isEditing = !!unidad;
    if (!unidad) return;

    const factor = Number(unidad.factor);
    const upb = unidad.unidades_por_base != null ? Number(unidad.unidades_por_base) : null;
    // El backend siempre persiste `factor`. Si es < 1 la presentación es más chica que la base.
    const modo: ModoEquivalencia = factor < 1 ? 'unidades_por_base' : 'factor';

    this.originalCodigoBarras = unidad.codigo_barras ?? null;
    this.modo.set(modo);
    this.form.patchValue({
      nombre: unidad.nombre,
      unidad_medida: unidad.unidad_medida,
      modo,
      unidades_por_base: upb ?? (factor > 0 ? Number((1 / factor).toFixed(6)) : null),
      factor: factor >= 1 ? factor : null,
      precio_venta: Number(unidad.precio_venta),
      codigo_barras: unidad.codigo_barras || '',
    });
  }

  save(): Observable<UnidadResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();
    const usaFactor = data.modo === 'factor';
    const equivalencia = usaFactor
      ? { factor: Number(data.factor), unidades_por_base: null }
      : { unidades_por_base: Number(data.unidades_por_base), factor: null };

    if (this.isEditing) {
      const codigoCambio = (data.codigo_barras || null) !== this.originalCodigoBarras;
      const payload: ActualizarUnidadRequest = {
        nombre: data.nombre!,
        unidad_medida: data.unidad_medida!,
        precio_venta: data.precio_venta!,
        ...equivalencia,
        ...(codigoCambio ? { codigo_barras: data.codigo_barras || null, cambiar_codigo_barras: true } : {}),
      };
      return this.productoService.actualizarUnidad(this.sheetData!.productoId, this.sheetData!.unidad!.id, payload);
    }

    const payload: AgregarUnidadRequest = {
      nombre: data.nombre!,
      unidad_medida: data.unidad_medida!,
      precio_venta: data.precio_venta!,
      ...equivalencia,
      codigo_barras: data.codigo_barras || null,
    };
    return this.productoService.agregarUnidad(this.sheetData!.productoId, payload);
  }
}
