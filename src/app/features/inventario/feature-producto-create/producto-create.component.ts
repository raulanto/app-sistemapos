import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideSave, lucidePlus, lucideTrash } from '@ng-icons/lucide';

import { ProductoService } from '../data-access/producto.service';
import { CategoriaService } from '../data-access/categoria.service';
import { SucursalService } from '../../../core/sucursal/sucursal.service';
import { MovimientoService } from '../data-access/movimiento.service';
import { CategoriaResponse } from '../data-access/inventario.models';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardFieldImports } from '../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardSwitchComponent } from '../../../shared/components/switch/switch.component';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-producto-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardSwitchComponent,
    ZardButtonComponent
  ],
  templateUrl: './producto-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideArrowLeft, lucideSave, lucidePlus, lucideTrash })]
})
export class ProductoCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  public sucursalService = inject(SucursalService);
  private movimientoService = inject(MovimientoService);
  private sonner = inject(ZardSonnerService);
  private router = inject(Router);

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

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.sonner.error('Verifica los campos requeridos');
      return;
    }
    
    this.loading.set(true);

    const data = { ...this.form.value } as any;
    delete data.existencias;

    if (data.codigo_barras === '') data.codigo_barras = null;
    if (data.descripcion === '') data.descripcion = null;

    this.productoService.crear(data).pipe(
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
    ).subscribe({
      next: (prodRes) => {
        this.sonner.success('Producto creado exitosamente');
        this.router.navigate(['/inventario/productos', prodRes.id]);
      },
      error: (err) => {
        console.error('Error al crear producto', err);
        this.sonner.error('Error al crear el producto');
        this.loading.set(false);
      }
    });
  }
}
