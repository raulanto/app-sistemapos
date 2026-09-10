import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, min, required, validateTree } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { ProductoService } from '../../data-access/producto.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { AgregarUnidadRequest, ActualizarUnidadRequest, UnidadResponse } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ImagenGaleriaComponent } from '../imagen-galeria/imagen-galeria.component';

export interface UnidadSheetData {
  productoId: string;
  /** Unidad de medida del producto padre, para textos de ayuda (ej. "reja"). */
  unidadBase?: string;
  unidad?: UnidadResponse;
}

type ModoEquivalencia = 'unidades_por_base' | 'factor';

@Component({
  selector: 'app-unidad-form-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports, ImagenGaleriaComponent],
  templateUrl: './unidad-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'unidadFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' },
})
export class UnidadFormSheetComponent implements OnInit {
  private productoService = inject(ProductoService);

  public sheetData = injectSheetData<UnidadSheetData>();

  isEditing = false;
  private originalCodigoBarras: string | null = null;

  private readonly model = signal({
    nombre: '',
    unidad_medida: 'pieza',
    modo: 'unidades_por_base' as ModoEquivalencia,
    unidades_por_base: 6 as number | null,
    factor: null as number | null,
    precio_venta: 0,
    codigo_barras: '',
    monedero_pct: null as number | null,
    monedero_monto: null as number | null,
  });

  protected readonly unidadForm = form(this.model, path => {
    required(path.nombre, { message: 'El nombre es obligatorio (máx. 50).' });
    maxLength(path.nombre, 50, { message: 'El nombre es obligatorio (máx. 50).' });
    required(path.unidad_medida, { message: 'Obligatoria (1–20 caracteres).' });
    maxLength(path.unidad_medida, 20, { message: 'Obligatoria (1–20 caracteres).' });
    required(path.modo, { message: 'Selecciona el tipo de equivalencia.' });
    required(path.precio_venta, { message: 'El precio de venta es obligatorio.' });
    min(path.precio_venta, 0, { message: 'El precio de venta no puede ser negativo.' });

    // Valida que el campo de equivalencia activo tenga un valor > 0 y lo reporta en ese campo.
    validateTree(path, ({ value, fieldTreeOf }) => {
      const v = value();
      const usaFactor = v.modo === 'factor';
      const valor = Number(usaFactor ? v.factor : v.unidades_por_base);
      if (Number.isFinite(valor) && valor > 0) return undefined;
      return {
        kind: 'equivalencia',
        message: 'Indica un valor mayor a 0 para la equivalencia.',
        fieldTree: fieldTreeOf(usaFactor ? path.factor : path.unidades_por_base),
      };
    });
  });

  readonly modo = computed(() => this.model().modo);
  readonly unidadBase = computed(() => this.sheetData?.unidadBase?.trim() || 'unidad base');

  ngOnInit() {
    const unidad = this.sheetData?.unidad;
    this.isEditing = !!unidad;
    if (!unidad) return;

    const factor = Number(unidad.factor);
    const upb = unidad.unidades_por_base != null ? Number(unidad.unidades_por_base) : null;
    // El backend siempre persiste `factor`. Si es < 1 la presentación es más chica que la base.
    const modo: ModoEquivalencia = factor < 1 ? 'unidades_por_base' : 'factor';

    this.originalCodigoBarras = unidad.codigo_barras ?? null;
    this.model.set({
      nombre: unidad.nombre,
      unidad_medida: unidad.unidad_medida,
      modo,
      unidades_por_base: upb ?? (factor > 0 ? Number((1 / factor).toFixed(6)) : null),
      factor: factor >= 1 ? factor : null,
      precio_venta: Number(unidad.precio_venta),
      codigo_barras: unidad.codigo_barras || '',
      monedero_pct: unidad.monedero_pct != null ? Number(unidad.monedero_pct) : null,
      monedero_monto: unidad.monedero_monto != null ? Number(unidad.monedero_monto) : null,
    });
  }

  private numOrNull(v: unknown): number | null {
    return v === '' || v == null ? null : Number(v);
  }

  save(): Observable<UnidadResponse> | void {
    const root = this.unidadForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();
    const usaFactor = data.modo === 'factor';
    const equivalencia = usaFactor
      ? { factor: Number(data.factor), unidades_por_base: null }
      : { unidades_por_base: Number(data.unidades_por_base), factor: null };

    const monederoCambio =
      this.unidadForm.monedero_pct().dirty() || this.unidadForm.monedero_monto().dirty();

    if (this.isEditing) {
      const codigoCambio = (data.codigo_barras || null) !== this.originalCodigoBarras;
      const payload: ActualizarUnidadRequest = {
        nombre: data.nombre,
        unidad_medida: data.unidad_medida,
        precio_venta: data.precio_venta,
        ...equivalencia,
        ...(codigoCambio ? { codigo_barras: data.codigo_barras || null, cambiar_codigo_barras: true } : {}),
        ...(monederoCambio
          ? {
              monedero_pct: this.numOrNull(data.monedero_pct),
              monedero_monto: this.numOrNull(data.monedero_monto),
              cambiar_monedero: true,
            }
          : {}),
      };
      return this.productoService.actualizarUnidad(this.sheetData!.productoId, this.sheetData!.unidad!.id, payload);
    }

    const payload: AgregarUnidadRequest = {
      nombre: data.nombre,
      unidad_medida: data.unidad_medida,
      precio_venta: data.precio_venta,
      ...equivalencia,
      codigo_barras: data.codigo_barras || null,
      monedero_pct: this.numOrNull(data.monedero_pct),
      monedero_monto: this.numOrNull(data.monedero_monto),
    };
    return this.productoService.agregarUnidad(this.sheetData!.productoId, payload);
  }
}
