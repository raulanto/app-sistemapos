import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrash } from '@ng-icons/lucide';

import { ProveedorService } from '../../data-access/proveedor.service';
import { PedidoProveedorResponse, ProveedorResponse } from '../../data-access/proveedores.models';
import { ProductoService } from '../../../inventario/data-access/producto.service';
import { ProductoResponse } from '../../../inventario/data-access/inventario.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

export interface PedidoProveedorSheetData {
  proveedorId?: string;
}

@Component({
  selector: 'app-pedido-proveedor-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardTextareaComponent,
    ZardButtonComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideTrash })],
  templateUrl: './pedido-proveedor-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'pedidoProveedorFormSheet',
  host: { style: 'display: contents' },
})
export class PedidoProveedorFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  readonly sheetData = injectSheetData<PedidoProveedorSheetData | undefined>();

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly productos = signal<ProductoResponse[]>([]);
  readonly cargando = signal(true);

  readonly form = this.fb.group({
    proveedor_id: [this.sheetData?.proveedorId ?? '', Validators.required],
    fecha_estimada_entrega: [''],
    notas: [''],
    lineas: this.fb.array<ReturnType<typeof this.nuevaLinea>>([]),
  });

  get lineas() {
    return this.form.get('lineas') as FormArray;
  }

  private nuevaLinea() {
    const g = this.fb.group({
      producto_id: ['', Validators.required],
      cantidad_solicitada: [1, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
    });
    // Sugiere el costo del producto como precio de compra al elegirlo.
    g.get('producto_id')!.valueChanges.subscribe(id => {
      const p = this.productos().find(x => x.id === id);
      if (p) g.get('precio_unitario')!.setValue(Number(p.costo) || 0);
    });
    return g;
  }

  ngOnInit() {
    this.agregarLinea();
    this.proveedorService.listar({ activo: true, page_size: 100, sort: 'razon_social:asc' }).subscribe({
      next: res => this.proveedores.set(res.data),
    });
    this.productoService.listar({ activo: true, page_size: 100, sort: 'nombre:asc' }).subscribe({
      next: res => {
        this.productos.set(res.data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  agregarLinea() {
    this.lineas.push(this.nuevaLinea());
  }

  quitarLinea(i: number) {
    this.lineas.removeAt(i);
  }

  totalLinea(i: number): number {
    const g = this.lineas.at(i);
    return (Number(g.get('cantidad_solicitada')?.value) || 0) * (Number(g.get('precio_unitario')?.value) || 0);
  }
  totalPedido(): number {
    return this.lineas.controls.reduce((s, _, i) => s + this.totalLinea(i), 0);
  }

  save(): Observable<PedidoProveedorResponse> | void {
    if (this.form.invalid || this.lineas.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    return this.proveedorService.crearPedido({
      proveedor_id: v.proveedor_id!,
      lineas: (v.lineas ?? []).map(l => ({
        producto_id: l.producto_id!,
        cantidad_solicitada: Number(l.cantidad_solicitada),
        precio_unitario: Number(l.precio_unitario),
      })),
      fecha_estimada_entrega: v.fecha_estimada_entrega || null,
      notas: v.notas?.trim() || null,
    });
  }
}
