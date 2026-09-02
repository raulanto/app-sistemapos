import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { ProductoService } from '../../data-access/producto.service';
import { CategoriaService } from '../../data-access/categoria.service';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';
import { MovimientoService } from '../../data-access/movimiento.service';
import { CategoriaResponse } from '../../data-access/inventario.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardSheetRef } from '../../../../shared/components/sheet/sheet-ref';
import { ZardSonnerService } from '../../../../shared/components/sonner/sonner.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrash } from '@ng-icons/lucide';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface ProductoSheetData {
  productoId?: string;
  onSaved?: () => void;
}

@Component({
  selector: 'app-producto-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ZardTextareaComponent
  ],
  templateUrl: './producto-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'productoFormSheet',
  viewProviders: [provideIcons({ lucidePlus, lucideTrash })]
})
export class ProductoFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  public sucursalService = inject(SucursalService);
  private movimientoService = inject(MovimientoService);
  public sheetRef = inject(ZardSheetRef);
  private sonner = inject(ZardSonnerService);
  
  public sheetData = injectSheetData<ProductoSheetData | undefined>();

  categorias = signal<CategoriaResponse[]>([]);
  loading = signal(false);

  form = this.fb.group({
    sku: ['', Validators.required],
    codigo_barras: [''],
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria_id: ['', Validators.required],
    unidad_medida: ['UNIDAD', Validators.required],
    precio_venta: ['0.00', Validators.required],
    costo: ['0.00', Validators.required],
    impuesto_tasa: ['0', Validators.required],
    permite_stock_negativo: [false],
    activo: [true],
    existencias: this.fb.array([])
  });

  get existenciasArray() {
    return this.form.get('existencias') as FormArray;
  }

  ngOnInit() {
    this.cargarCategorias();
    
    if (this.sheetData?.productoId) {
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

  agregarExistencia() {
    const group = this.fb.group({
      sucursal_id: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      umbral: [0, [Validators.required, Validators.min(0)]]
    });
    this.existenciasArray.push(group);
  }

  removerExistencia(index: number) {
    this.existenciasArray.removeAt(index);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    if (this.sheetData?.productoId && !this.form.dirty) {
      this.sonner.info('No se detectaron cambios');
      this.sheetRef.close();
      return;
    }
    
    this.loading.set(true);
    const data = { ...this.form.value } as any;
    delete data.existencias;

    if (data.codigo_barras === '') data.codigo_barras = null;
    if (data.descripcion === '') data.descripcion = null;

    let request$: Observable<any>;

    if (this.sheetData?.productoId) {
      const updateData = { ...data };
      delete updateData.activo; // Not in the update schema
      
      updateData.tipo = 'simple';
      updateData.cambiar_codigo_barras = this.form.get('codigo_barras')?.dirty ?? false;
      updateData.cambiar_descripcion = this.form.get('descripcion')?.dirty ?? false;
      
      // Ensure numeric fields are numbers
      updateData.precio_venta = Number(updateData.precio_venta);
      updateData.costo = Number(updateData.costo);
      updateData.impuesto_tasa = Number(updateData.impuesto_tasa);

      request$ = this.productoService.actualizar(this.sheetData.productoId, updateData);
    } else {
      request$ = this.productoService.crear(data).pipe(
        switchMap(prodRes => {
          const operations: Observable<any>[] = [];
          
          this.existenciasArray.controls.forEach(c => {
            const sucursal_id = c.get('sucursal_id')?.value;
            const cantidad = c.get('cantidad')?.value;
            const umbral = c.get('umbral')?.value;

            if (cantidad > 0) {
              operations.push(this.movimientoService.aplicar({
                 producto_id: prodRes.id,
                 sucursal_id: sucursal_id,
                 tipo: 'entrada',
                 cantidad: cantidad,
                 referencia_tipo: 'inventario_inicial',
                 motivo: 'Inventario inicial'
              }));
            }
            if (umbral > 0) {
              operations.push(this.productoService.actualizarUmbrales(prodRes.id, sucursal_id, {
                stock_minimo: umbral
              }));
            }
          });

          if (operations.length > 0) {
            return forkJoin(operations).pipe(map(() => prodRes));
          }
          return of(prodRes);
        })
      );
    }

    request$.subscribe({
      next: () => {
        if (this.sheetData?.onSaved) {
          this.sheetData.onSaved();
        }
        this.sheetRef.close(true); // Return true to indicate success
      },
      error: (err) => {
        console.error('Error al guardar', err);
        this.sonner.error('Error al procesar la solicitud');
        this.loading.set(false);
      }
    });
  }
}
