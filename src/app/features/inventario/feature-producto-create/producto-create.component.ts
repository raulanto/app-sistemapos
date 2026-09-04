import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormArray, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, retry } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideSave, lucidePlus, lucideTrash, lucidePackage, lucideLayers } from '@ng-icons/lucide';

import { ProductoService } from '../data-access/producto.service';
import { CategoriaService } from '../data-access/categoria.service';
import { UnidadMedidaService } from '../data-access/unidad-medida.service';
import { SucursalService } from '../../../core/sucursal/sucursal.service';
import { MovimientoService } from '../data-access/movimiento.service';
import { CategoriaResponse, ProductoResponse, UnidadMedidaResponse, TipoProducto } from '../data-access/inventario.models';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { UnidadMedidaFormSheetComponent } from '../ui/unidad-medida-form-sheet/unidad-medida-form-sheet.component';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardFieldImports } from '../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardSwitchComponent } from '../../../shared/components/switch/switch.component';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardAlertComponent } from '../../../shared/components/alert/alert.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSeparatorComponent } from '../../../shared/components/separator/separator.component';

/** En una presentación, el campo de equivalencia del modo activo debe ser > 0. */
function equivalenciaUnidadValidator(control: AbstractControl): ValidationErrors | null {
  const campo = control.get('modo')?.value === 'factor' ? 'factor' : 'unidades_por_base';
  const valor = Number(control.get(campo)?.value);
  return Number.isFinite(valor) && valor > 0 ? null : { equivalencia: true };
}

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
    ZardButtonComponent,
    ZardAlertComponent,
    ZardEmptyComponent,
    ZardSeparatorComponent
  ],
  templateUrl: './producto-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideArrowLeft, lucideSave, lucidePlus, lucideTrash, lucidePackage, lucideLayers })]
})
export class ProductoCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private unidadMedidaService = inject(UnidadMedidaService);
  public sucursalService = inject(SucursalService);
  private movimientoService = inject(MovimientoService);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);
  private router = inject(Router);

  categorias = signal<CategoriaResponse[]>([]);
  productosSimples = signal<ProductoResponse[]>([]);
  unidadesMedida = signal<UnidadMedidaResponse[]>([]);
  loading = signal(false);

  form = this.fb.group({
    sku: ['', Validators.required],
    codigo_barras: [''],
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria_id: ['', Validators.required],
    unidad_medida: ['UNIDAD', Validators.required],
    unidad_medida_id: [null as string | null],
    precio_venta: ['0.00', [Validators.required, Validators.min(0.01)]],
    costo: ['0.00', [Validators.required, Validators.min(0.01)]],
    impuesto_tasa: ['0', [Validators.required, Validators.min(0)]],
    permite_stock_negativo: [false],
    permite_venta_fraccionada: [false],
    incremento_minimo_venta: [null as number | null],
    activo: [true],
    tipo: ['simple' as TipoProducto, Validators.required],
    existencias: this.fb.array([]),
    componentes: this.fb.array([]),
    unidades: this.fb.array([])
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

  /** Se activa tras un intento de envío fallido para mostrar el resumen de errores. */
  readonly intentoEnvio = signal(false);

  private readonly etiquetasCampos: Record<string, string> = {
    sku: 'SKU',
    nombre: 'Nombre',
    categoria_id: 'Categoría',
    tipo: 'Tipo',
    unidad_medida: 'Unidad de medida',
    precio_venta: 'Precio de venta',
    costo: 'Costo',
    impuesto_tasa: 'Impuesto',
  };

  /** Lista de secciones/campos con error para el aviso superior. */
  readonly resumenErrores = computed<string[]>(() => {
    this.formEvents();
    if (!this.intentoEnvio()) return [];

    const errores: string[] = [];
    for (const [campo, etiqueta] of Object.entries(this.etiquetasCampos)) {
      if (this.form.get(campo)?.invalid) errores.push(etiqueta);
    }
    if (this.unidadesArray.controls.some(c => c.invalid)) errores.push('Presentaciones de venta');
    if (this.existenciasArray.controls.some(c => c.invalid)) errores.push('Inventario inicial');
    if (this.form.get('tipo')?.value === 'kit' && this.componentesArray.controls.some(c => c.invalid)) {
      errores.push('Receta del kit');
    }
    return errores;
  });

  get existenciasArray() {
    return this.form.get('existencias') as FormArray;
  }

  get componentesArray() {
    return this.form.get('componentes') as FormArray;
  }

  get unidadesArray() {
    return this.form.get('unidades') as FormArray;
  }

  /** `fraccionable`/`simple`: puede tener venta fraccionada. `kit`/`servicio`: no aplica. */
  readonly permiteFraccionamiento = computed(() => {
    this.formEvents();
    const tipo = this.form.get('tipo')?.value;
    return tipo === 'simple' || tipo === 'fraccionable';
  });

  readonly esFraccionable = computed(() => {
    this.formEvents();
    return this.form.get('tipo')?.value === 'fraccionable';
  });

  /** `servicio`: nunca mueve inventario (flete, mano de obra) — no aplica stock ni presentaciones. */
  readonly esServicio = computed(() => {
    this.formEvents();
    return this.form.get('tipo')?.value === 'servicio';
  });

  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductosSimples();
    this.cargarUnidadesMedida();
    this.form.controls.tipo.valueChanges.subscribe(tipo => this.onTipoChange(tipo as TipoProducto));
  }

  private onTipoChange(tipo: TipoProducto) {
    const puedeFraccionar = tipo === 'simple' || tipo === 'fraccionable';
    if (!puedeFraccionar) {
      this.form.patchValue({ permite_venta_fraccionada: false, incremento_minimo_venta: null });
    } else if (tipo === 'fraccionable') {
      // El backend fuerza permite_venta_fraccionada=true para este tipo.
      this.form.patchValue({ permite_venta_fraccionada: true });
    }
  }

  cargarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al cargar categorias', err)
    });
  }

  cargarUnidadesMedida() {
    this.unidadMedidaService.listar().subscribe({
      next: (data) => this.unidadesMedida.set(data),
      error: (err) => console.error('Error al cargar unidades de medida', err)
    });
  }

  /** Alta rápida cuando la unidad de medida deseada todavía no existe en el catálogo. */
  abrirCrearUnidadMedida() {
    this.sheetService.create({
      zTitle: 'Nueva unidad de medida',
      zDescription: 'Agrega una unidad al catálogo (kg, l, ml, pza, hora, …). Queda disponible para todos los productos.',
      zContent: UnidadMedidaFormSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (nueva: UnidadMedidaResponse) => {
              this.sonner.success('Unidad de medida creada');
              this.unidadesMedida.update(list => [...list, nueva]);
              this.form.patchValue({ unidad_medida_id: nueva.id });
              resolve();
            },
            error: (err: any) => {
              console.error('Error al crear unidad de medida', err);
              this.sonner.error('Error al crear la unidad de medida');
              reject(err);
            }
          });
        });
      }
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
      costo_unitario: [0, [Validators.min(0)]],
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

  agregarUnidad() {
    const group = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        unidad_medida: ['pieza', [Validators.required, Validators.maxLength(20)]],
        modo: ['unidades_por_base', Validators.required],
        unidades_por_base: [6 as number | null],
        factor: [null as number | null],
        precio_venta: [0, [Validators.required, Validators.min(0)]],
        codigo_barras: ['']
      },
      { validators: equivalenciaUnidadValidator }
    );
    this.unidadesArray.push(group);
  }

  removerUnidad(index: number) {
    this.unidadesArray.removeAt(index);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.intentoEnvio.set(true);
      this.sonner.error('Verifica los campos requeridos');
      return;
    }

    this.intentoEnvio.set(false);
    this.loading.set(true);

    const data = { ...this.form.value } as any;
    delete data.existencias;
    delete data.componentes;
    delete data.unidades;

    if (data.codigo_barras === '') data.codigo_barras = null;
    if (data.descripcion === '') data.descripcion = null;
    if (data.unidad_medida_id === '') data.unidad_medida_id = null;
    if (data.incremento_minimo_venta === '' || data.incremento_minimo_venta == null) {
      data.incremento_minimo_venta = null;
    } else {
      data.incremento_minimo_venta = Number(data.incremento_minimo_venta);
    }

    const esServicio = data.tipo === 'servicio';

    this.productoService.crear(data).pipe(
      switchMap(prodRes => {
        const operations: Observable<any>[] = [];

        // Un servicio nunca mueve inventario ni tiene presentaciones de venta.
        if (esServicio) {
          return of(prodRes);
        }

        this.existenciasArray.controls.forEach(c => {
          const sucursal_id = c.get('sucursal_id')?.value;
          const cantidad = Number(c.get('cantidad')?.value) || 0;
          const costo_unitario = Number(c.get('costo_unitario')?.value) || 0;
          const stock_minimo = Number(c.get('stock_minimo')?.value) || 0;
          const stock_maximo = Number(c.get('stock_maximo')?.value) || 0;
          const tipo = c.get('tipo')?.value;
          const referencia_tipo = c.get('referencia_tipo')?.value;
          const motivo = c.get('motivo')?.value;

          if (cantidad > 0) {
            // El movimiento crea la existencia con saldo, umbrales y costo de una sola vez.
            const payload: any = {
              producto_id: prodRes.id,
              sucursal_id,
              tipo,
              cantidad,
              referencia_tipo,
              motivo
            };
            if (stock_minimo > 0) payload.stock_minimo = stock_minimo;
            if (stock_maximo > 0) payload.stock_maximo = stock_maximo;
            if (tipo === 'entrada' && costo_unitario > 0) {
              payload.costo_unitario = costo_unitario;
              payload.actualizar_costo = true;
            }

            operations.push(
              this.movimientoService.aplicar(payload).pipe(retry({ count: 3, delay: 1000 }))
            );
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
        } else {
          // Presentaciones de venta (producto_unidad): la unidad base ya vive en el propio producto.
          this.unidadesArray.controls.forEach(c => {
            const nombre = (c.get('nombre')?.value || '').trim();
            if (!nombre) return;
            const usaFactor = c.get('modo')?.value === 'factor';
            const equivalencia = usaFactor
              ? { factor: Number(c.get('factor')?.value) }
              : { unidades_por_base: Number(c.get('unidades_por_base')?.value) };
            operations.push(this.productoService.agregarUnidad(prodRes.id, {
              nombre,
              unidad_medida: c.get('unidad_medida')?.value,
              precio_venta: Number(c.get('precio_venta')?.value) || 0,
              codigo_barras: c.get('codigo_barras')?.value || null,
              ...equivalencia
            }));
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
