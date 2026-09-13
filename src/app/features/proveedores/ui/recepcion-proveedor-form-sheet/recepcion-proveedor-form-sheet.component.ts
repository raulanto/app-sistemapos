import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrash } from '@ng-icons/lucide';

import { ProveedorService } from '../../data-access/proveedor.service';
import {
  ACCIONES_DEFECTO,
  LineaRecepcionRequest,
  MOTIVOS_DEFECTO,
  ProveedorResponse,
  RecepcionProveedorResponse,
} from '../../data-access/proveedores.models';
import { ProductoService } from '../../../inventario/data-access/producto.service';
import { ProductoResponse } from '../../../inventario/data-access/inventario.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

export interface RecepcionProveedorSheetData {
  proveedorId?: string;
  pedidoId?: string | null;
  /** Líneas pendientes del pedido, si se abrió desde «Recibir mercancía». */
  pedidoLineas?: { producto_id: string; pendiente: number }[];
}

@Component({
  selector: 'app-recepcion-proveedor-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardTextareaComponent,
    ZardButtonComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideTrash })],
  templateUrl: './recepcion-proveedor-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'recepcionProveedorFormSheet',
  host: { style: 'display: contents' },
})
export class RecepcionProveedorFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  readonly sheetData = injectSheetData<RecepcionProveedorSheetData | undefined>();

  readonly motivos = MOTIVOS_DEFECTO;
  readonly acciones = ACCIONES_DEFECTO;

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly productos = signal<ProductoResponse[]>([]);

  readonly proveedorFijo = !!this.sheetData?.proveedorId;

  readonly form = this.fb.group({
    proveedor_id: [{ value: this.sheetData?.proveedorId ?? '', disabled: this.proveedorFijo }, Validators.required],
    numero_factura: [''],
    numero_remision: [''],
    transportista: [''],
    notas: [''],
    lineas: this.fb.array<ReturnType<typeof this.nuevaLinea>>([]),
  });

  get lineas() {
    return this.form.get('lineas') as FormArray;
  }

  private nuevaLinea(productoId = '', cantidadEsperada: number | null = null) {
    return this.fb.group({
      producto_id: [productoId, Validators.required],
      cantidad_esperada: [cantidadEsperada],
      cantidad_recibida_buena: [cantidadEsperada ?? 0, [Validators.required, Validators.min(0)]],
      cantidad_defectuosa: [0, [Validators.required, Validators.min(0)]],
      motivo_defecto: [null as string | null],
      accion_defecto: [null as string | null],
    });
  }

  ngOnInit() {
    const pedidoLineas = this.sheetData?.pedidoLineas ?? [];
    if (pedidoLineas.length > 0) {
      for (const l of pedidoLineas) this.lineas.push(this.nuevaLinea(l.producto_id, l.pendiente));
    } else {
      this.lineas.push(this.nuevaLinea());
    }

    if (this.proveedorFijo) {
      // Sólo para que el <z-select> deshabilitado tenga la opción a mostrar.
      this.proveedorService.obtener(this.sheetData!.proveedorId!).subscribe({
        next: p => this.proveedores.set([p]),
      });
    } else {
      this.proveedorService.listar({ activo: true, page_size: 100, sort: 'razon_social:asc' }).subscribe({
        next: res => this.proveedores.set(res.data),
      });
    }
    this.productoService.listar({ activo: true, page_size: 100, sort: 'nombre:asc' }).subscribe({
      next: res => this.productos.set(res.data),
    });
  }

  agregarLinea() {
    this.lineas.push(this.nuevaLinea());
  }
  quitarLinea(i: number) {
    this.lineas.removeAt(i);
  }

  tieneDefecto(i: number): boolean {
    return Number(this.lineas.at(i).get('cantidad_defectuosa')?.value) > 0;
  }

  faltaDefecto(i: number): boolean {
    if (!this.tieneDefecto(i)) return false;
    const g = this.lineas.at(i);
    return !g.get('motivo_defecto')?.value || !g.get('accion_defecto')?.value;
  }

  hayLineaConDefectoIncompleto(): boolean {
    return this.lineas.controls.some((_, i) => this.faltaDefecto(i));
  }

  save(): Observable<RecepcionProveedorResponse> | void {
    if (this.form.invalid || this.lineas.length === 0 || this.hayLineaConDefectoIncompleto()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const lineas: LineaRecepcionRequest[] = (v.lineas ?? []).map(l => {
      const defectuosa = Number(l.cantidad_defectuosa) || 0;
      const base: LineaRecepcionRequest = {
        producto_id: l.producto_id!,
        cantidad_recibida_buena: Number(l.cantidad_recibida_buena) || 0,
        cantidad_defectuosa: defectuosa,
        cantidad_esperada: l.cantidad_esperada != null && l.cantidad_esperada !== ('' as unknown) ? Number(l.cantidad_esperada) : null,
      };
      // El backend rechaza motivo/acción si no hay defecto: se omiten por completo, no se mandan en null.
      if (defectuosa > 0) {
        base.motivo_defecto = l.motivo_defecto as LineaRecepcionRequest['motivo_defecto'];
        base.accion_defecto = l.accion_defecto as LineaRecepcionRequest['accion_defecto'];
      }
      return base;
    });

    return this.proveedorService.crearRecepcion({
      proveedor_id: v.proveedor_id!,
      lineas,
      pedido_id: this.sheetData?.pedidoId ?? null,
      numero_factura: v.numero_factura?.trim() || null,
      numero_remision: v.numero_remision?.trim() || null,
      transportista: v.transportista?.trim() || null,
      notas: v.notas?.trim() || null,
    });
  }
}
