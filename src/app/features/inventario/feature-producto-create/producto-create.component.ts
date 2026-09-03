import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, retry } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideSave, lucidePlus, lucideTrash } from '@ng-icons/lucide';

import { ProductoService } from '../data-access/producto.service';
import { CategoriaService } from '../data-access/categoria.service';
import { SucursalService } from '../../../core/sucursal/sucursal.service';
import { MovimientoService } from '../data-access/movimiento.service';
import { CategoriaResponse, ProductoResponse } from '../data-access/inventario.models';
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
  productosSimples = signal<ProductoResponse[]>([]);
  loading = signal(false);

  form = this.fb.group({
    sku: ['', Validators.required],
    codigo_barras: [''],
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria_id: ['', Validators.required],
    unidad_medida: ['UNIDAD', Validators.required],
    precio_venta: ['0.00', [Validators.required, Validators.min(0.01)]],
    costo: ['0.00', [Validators.required, Validators.min(0.01)]],
    impuesto_tasa: ['0', [Validators.required, Validators.min(0)]],
    permite_stock_negativo: [false],
    activo: [true],
    tipo: ['simple', Validators.required],
    existencias: this.fb.array([]),
    componentes: this.fb.array([])
  });

  private formEvents = toSignal(this.form.events);

  getFieldError(controlName: string) {
    return computed(() => {
      this.formEvents(); // trigger reactivity
      const ctrl = this.form.get(controlName);
      if (ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty)) {
        if (ctrl.errors?.['required']) return [{ message: 'Este campo es requerido' }];
        if (ctrl.errors?.['min']) return [{ message: 'El valor no puede ser negativo' }];
        return [{ message: 'El valor es inválido' }];
      }
      return [];
    });
  }

  skuError = this.getFieldError('sku');
  nombreError = this.getFieldError('nombre');
  categoriaError = this.getFieldError('categoria_id');
  unidadMedidaError = this.getFieldError('unidad_medida');
  precioVentaError = this.getFieldError('precio_venta');
  costoError = this.getFieldError('costo');
  impuestoTasaError = this.getFieldError('impuesto_tasa');
  tipoError = this.getFieldError('tipo');

  get existenciasArray() {
    return this.form.get('existencias') as FormArray;
  }

  get componentesArray() {
    return this.form.get('componentes') as FormArray;
  }

  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductosSimples();
  }

  cargarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al cargar categorias', err)
    });
  }

  cargarProductosSimples() {
    this.productoService.listar({ activo: true, page_size: 100 }).subscribe({
      next: (res) => {
        const prods = res.data.filter(p => (p.tipo || 'simple') !== 'kit');
        this.productosSimples.set(prods);
      },
      error: (err) => console.error('Error al cargar productos simples', err)
    });
  }

  agregarExistencia() {
    const group = this.fb.group({
      sucursal_id: ['', Validators.required],
      tipo: ['entrada', Validators.required],
      referencia_tipo: ['inventario_inicial', Validators.required],
      motivo: ['Inventario inicial'],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      stock_minimo: [0, [Validators.min(0)]],
      stock_maximo: [0, [Validators.min(0)]]
    });
    this.existenciasArray.push(group);
  }

  removerExistencia(index: number) {
    this.existenciasArray.removeAt(index);
  }

  agregarComponente() {
    const group = this.fb.group({
      producto_componente_id: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]]
    });
    this.componentesArray.push(group);
  }

  removerComponente(index: number) {
    this.componentesArray.removeAt(index);
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
    delete data.componentes;

    if (data.codigo_barras === '') data.codigo_barras = null;
    if (data.descripcion === '') data.descripcion = null;

    this.productoService.crear(data).pipe(
      switchMap(prodRes => {
        const operations: Observable<any>[] = [];
        
        this.existenciasArray.controls.forEach(c => {
          const sucursal_id = c.get('sucursal_id')?.value;
          const cantidad = c.get('cantidad')?.value;
          const stock_minimo = c.get('stock_minimo')?.value;
          const stock_maximo = c.get('stock_maximo')?.value;
          const tipo = c.get('tipo')?.value;
          const referencia_tipo = c.get('referencia_tipo')?.value;
          const motivo = c.get('motivo')?.value;

          if (cantidad > 0) {
            const movObs$ = this.movimientoService.aplicar({
               producto_id: prodRes.id,
               sucursal_id: sucursal_id,
               tipo: tipo,
               cantidad: cantidad,
               referencia_tipo: referencia_tipo,
               motivo: motivo
            }).pipe(
              retry({ count: 3, delay: 1000 }),
              switchMap(() => {
                if (stock_minimo > 0 || stock_maximo > 0) {
                  const umbralesPayload: any = {};
                  if (stock_minimo > 0) umbralesPayload.stock_minimo = stock_minimo;
                  if (stock_maximo > 0) umbralesPayload.stock_maximo = stock_maximo;
                  
                  return this.productoService.actualizarUmbrales(prodRes.id, sucursal_id, umbralesPayload);
                }
                return of(null);
              })
            );
            operations.push(movObs$);
          } else if (stock_minimo > 0 || stock_maximo > 0) {
            this.sonner.warning('Algunos umbrales fueron ignorados porque requieren registrar un stock inicial mayor a 0 primero.');
          }
        });

        if (data.tipo === 'kit') {
          this.componentesArray.controls.forEach(c => {
            const producto_componente_id = c.get('producto_componente_id')?.value;
            const cantidad = c.get('cantidad')?.value;
            if (producto_componente_id && cantidad > 0) {
              operations.push(this.productoService.agregarComponente(prodRes.id, {
                producto_componente_id,
                cantidad
              }));
            }
          });
        }

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
