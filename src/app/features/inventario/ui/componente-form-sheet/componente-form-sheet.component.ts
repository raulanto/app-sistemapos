import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProductoService } from '../../data-access/producto.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { AgregarComponenteRequest, ActualizarComponenteRequest, ProductoResponse, ComponenteResponse } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface ComponenteSheetData {
  kitId: string;
  componente?: ComponenteResponse;
}

@Component({
  selector: 'app-componente-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports
  ],
  templateUrl: './componente-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'componenteFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' }
})
export class ComponenteFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  
  public sheetData = injectSheetData<ComponenteSheetData>();

  productos = signal<ProductoResponse[]>([]);
  
  isEditing = false;

  form = this.fb.group({
    producto_componente_id: ['', Validators.required],
    cantidad: [0, [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit() {
    this.isEditing = !!this.sheetData?.componente;
    
    if (this.isEditing) {
      this.form.get('producto_componente_id')?.disable(); // Prevent changing product when editing
      this.form.patchValue({
        producto_componente_id: this.sheetData!.componente!.producto_componente_id,
        cantidad: Number(this.sheetData!.componente!.cantidad)
      });
    }

    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.listar({ activo: true, page_size: 100 }).subscribe({
      next: (res) => {
        let prods = res.data.filter(p => (p.tipo || 'simple') !== 'kit');
        this.productos.set(prods);
      },
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  save(): Observable<ComponenteResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const data = this.form.getRawValue();
    
    if (this.isEditing) {
      const payload: ActualizarComponenteRequest = {
        cantidad: data.cantidad!
      };
      return this.productoService.actualizarComponente(this.sheetData!.kitId, this.sheetData!.componente!.producto_componente_id, payload);
    } else {
      const payload: AgregarComponenteRequest = {
        producto_componente_id: data.producto_componente_id!,
        cantidad: data.cantidad!
      };
      return this.productoService.agregarComponente(this.sheetData!.kitId, payload);
    }
  }
}
