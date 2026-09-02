import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProductoService } from '../../data-access/producto.service';
import { CategoriaService } from '../../data-access/categoria.service';
import { CategoriaResponse } from '../../data-access/inventario.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface ProductoSheetData {
  productoId?: string;
}

@Component({
  selector: 'app-producto-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports
  ],
  templateUrl: './producto-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'productoFormSheet'
})
export class ProductoFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  
  // sheetData can be undefined if opened without data (for creation)
  private sheetData = injectSheetData<ProductoSheetData | undefined>();

  categorias = signal<CategoriaResponse[]>([]);

  form = this.fb.group({
    sku: ['', Validators.required],
    codigo_barras: [''],
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria_id: [''],
    unidad_medida: ['UNIDAD'],
    precio_venta: ['0.00', Validators.required],
    costo: ['0.00', Validators.required],
    impuesto_tasa: ['0'],
    permite_stock_negativo: [false],
    activo: [true]
  });

  ngOnInit() {
    this.cargarCategorias();
    
    if (this.sheetData?.productoId) {
      // Si recibimos un ID, estamos en modo edición.
      this.productoService.obtenerPorId(this.sheetData.productoId).subscribe({
        next: (prod) => this.form.patchValue(prod as any),
        error: (err) => console.error('Error al obtener producto', err)
      });
    }
  }

  cargarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al cargar categorias', err)
    });
  }

  /**
   * Esta función es llamada por el sheet cuando se hace click en el botón de confirmación.
   * Retornar un Observable permite que el sheet maneje el estado de carga (loading) 
   * y se cierre automáticamente al finalizar.
   */
  save(): Observable<any> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const data = this.form.value as any;
    if (this.sheetData?.productoId) {
      return this.productoService.actualizar(this.sheetData.productoId, data);
    } else {
      return this.productoService.crear(data);
    }
  }
}
