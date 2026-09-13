import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProveedorService } from '../../data-access/proveedor.service';
import { ProductoProveedorResponse, ProveedorResponse } from '../../data-access/proveedores.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';

export interface ProductoProveedorSheetData {
  productoId: string;
}

/**
 * Vincular un proveedor a un producto. Sólo hay endpoints para crear/desvincular/marcar-principal
 * (no un PATCH para editar precio/stock de un vínculo existente): para "editar" hay que
 * desvincular y volver a vincular con los nuevos valores.
 */
@Component({
  selector: 'app-producto-proveedor-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports, ZardCheckboxComponent],
  templateUrl: './producto-proveedor-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'productoProveedorFormSheet',
  host: { style: 'display: contents' },
})
export class ProductoProveedorFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  readonly sheetData = injectSheetData<ProductoProveedorSheetData>();

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly cargando = signal(true);

  readonly form = this.fb.group({
    proveedor_id: ['', Validators.required],
    precio_compra: [0, [Validators.required, Validators.min(0)]],
    tiempo_entrega_dias: [1, [Validators.required, Validators.min(0)]],
    stock_minimo: [0, [Validators.required, Validators.min(0)]],
    cantidad_reorden: [0, [Validators.required, Validators.min(0.01)]],
    stock_maximo: [null as number | null],
    codigo_proveedor: [''],
    es_proveedor_principal: [false],
  });

  ngOnInit() {
    this.proveedorService.listar({ activo: true, page_size: 100, sort: 'razon_social:asc' }).subscribe({
      next: res => {
        this.proveedores.set(res.data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  save(): Observable<ProductoProveedorResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    return this.proveedorService.vincularProveedor(this.sheetData.productoId, {
      proveedor_id: v.proveedor_id!,
      precio_compra: Number(v.precio_compra),
      tiempo_entrega_dias: Number(v.tiempo_entrega_dias),
      stock_minimo: Number(v.stock_minimo),
      cantidad_reorden: Number(v.cantidad_reorden),
      stock_maximo: v.stock_maximo != null && v.stock_maximo !== ('' as unknown) ? Number(v.stock_maximo) : null,
      codigo_proveedor: v.codigo_proveedor?.trim() || null,
      es_proveedor_principal: !!v.es_proveedor_principal,
    });
  }
}
