import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { disabled, form, FormField, min, required } from '@angular/forms/signals';
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
    FormField,
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
  private productoService = inject(ProductoService);

  public sheetData = injectSheetData<ComponenteSheetData>();

  productos = signal<ProductoResponse[]>([]);

  isEditing = false;

  private readonly model = signal({ producto_componente_id: '', cantidad: 0 });

  protected readonly componenteForm = form(this.model, path => {
    required(path.producto_componente_id, { message: 'Selecciona un producto.' });
    // Al editar no se puede cambiar el producto del componente.
    disabled(path.producto_componente_id, () => !!this.sheetData?.componente);
    required(path.cantidad, { message: 'La cantidad es obligatoria.' });
    min(path.cantidad, 0.01, { message: 'Debe ser mayor a 0.' });
  });

  ngOnInit() {
    this.isEditing = !!this.sheetData?.componente;

    if (this.isEditing) {
      this.model.set({
        producto_componente_id: this.sheetData.componente!.producto_componente_id,
        cantidad: Number(this.sheetData.componente!.cantidad)
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
    const root = this.componenteForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const data = this.model();

    if (this.isEditing) {
      const payload: ActualizarComponenteRequest = {
        cantidad: data.cantidad
      };
      return this.productoService.actualizarComponente(this.sheetData.kitId, this.sheetData.componente!.producto_componente_id, payload);
    } else {
      const payload: AgregarComponenteRequest = {
        producto_componente_id: data.producto_componente_id,
        cantidad: data.cantidad
      };
      return this.productoService.agregarComponente(this.sheetData.kitId, payload);
    }
  }
}
