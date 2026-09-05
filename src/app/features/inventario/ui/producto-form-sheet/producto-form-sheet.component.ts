import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, retry } from 'rxjs/operators';

import { ProductoService } from '../../data-access/producto.service';
import { CategoriaService } from '../../data-access/categoria.service';
import { UnidadMedidaService } from '../../data-access/unidad-medida.service';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';
import { MovimientoService } from '../../data-access/movimiento.service';
import { CategoriaResponse, UnidadMedidaResponse, TipoProducto } from '../../data-access/inventario.models';
import { injectSheetData, ZardSheetService } from '../../../../shared/components/sheet/sheet.service';
import { ZardSheetRef } from '../../../../shared/components/sheet/sheet-ref';
import { ZardSonnerService } from '../../../../shared/components/sonner/sonner.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrash } from '@ng-icons/lucide';
import { UnidadMedidaFormSheetComponent } from '../unidad-medida-form-sheet/unidad-medida-form-sheet.component';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ImagenGaleriaComponent } from '../imagen-galeria/imagen-galeria.component';

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
    ZardTextareaComponent,
    ImagenGaleriaComponent
  ],
  templateUrl: './producto-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'productoFormSheet',
  viewProviders: [provideIcons({ lucidePlus, lucideTrash })],
  // El sheet proyecta este componente dentro de un <main> flex: sin display:contents, este
  // host (un elemento inline por defecto) rompe la cadena flex-1/min-h-0 y el <form> nunca
  // llega a scrollear, tapando los botones del footer.
  host: { style: 'display: contents' }
})
export class ProductoFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private unidadMedidaService = inject(UnidadMedidaService);
  public sucursalService = inject(SucursalService);
  private movimientoService = inject(MovimientoService);
  public sheetRef = inject(ZardSheetRef);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);

  public sheetData = injectSheetData<ProductoSheetData | undefined>();

  categorias = signal<CategoriaResponse[]>([]);
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
    precio_venta: ['0.00', Validators.required],
    costo: ['0.00', Validators.required],
    impuesto_tasa: ['0', Validators.required],
    permite_stock_negativo: [false],
    permite_venta_fraccionada: [false],
    incremento_minimo_venta: [null as number | null],
    tipo: ['simple' as TipoProducto, Validators.required],
    activo: [true],
    existencias: this.fb.array([])
  });

  /** `fraccionable`/`simple`: puede tener venta fraccionada. `kit`/`servicio`: no aplica. */
  readonly permiteFraccionamiento = signal(true);
  /** `servicio`: nunca mueve inventario, no tiene sentido cargar stock inicial. */
  readonly esServicio = signal(false);

  get existenciasArray() {
    return this.form.get('existencias') as FormArray;
  }

  ngOnInit() {
    this.cargarCategorias();
    this.cargarUnidadesMedida();

    if (this.sheetData?.productoId) {
      this.productoService.obtenerPorId(this.sheetData.productoId).subscribe({
        next: (prod) => {
          this.form.patchValue(prod as any);
          if (!prod.tipo) {
            this.form.patchValue({ tipo: 'simple' });
          }
          // Solo fija enable/disable según lo cargado; no pisa los valores recién leídos del server.
          this.applyTipoState((prod.tipo || 'simple') as TipoProducto, false);
          this.watchTipoChanges();
        },
        error: (err) => console.error('Error al obtener producto', err)
      });
    } else {
      this.applyTipoState('simple', false);
      this.watchTipoChanges();
    }
  }

  /** Reacciona a cambios de tipo hechos por el usuario en el select (no al patch inicial). */
  private watchTipoChanges() {
    this.form.controls.tipo.valueChanges.subscribe(tipo => this.applyTipoState(tipo as TipoProducto, true));
  }

  private applyTipoState(tipo: TipoProducto, esCambioDeUsuario: boolean) {
    const puedeFraccionar = tipo === 'simple' || tipo === 'fraccionable';
    this.permiteFraccionamiento.set(puedeFraccionar);
    this.esServicio.set(tipo === 'servicio');

    if (!puedeFraccionar) {
      if (esCambioDeUsuario) {
        // El usuario movió el producto a kit/servicio: limpiar la config de fraccionamiento
        // y marcar el control como dirty para que el guardado la borre en el backend.
        this.form.patchValue({ permite_venta_fraccionada: false, incremento_minimo_venta: null }, { emitEvent: false });
        this.form.controls.incremento_minimo_venta.markAsDirty();
      }
      this.form.controls.permite_venta_fraccionada.disable({ emitEvent: false });
      this.form.controls.incremento_minimo_venta.disable({ emitEvent: false });
      return;
    }

    this.form.controls.incremento_minimo_venta.enable({ emitEvent: false });
    if (tipo === 'fraccionable') {
      // El backend fuerza permite_venta_fraccionada=true para este tipo.
      this.form.patchValue({ permite_venta_fraccionada: true }, { emitEvent: false });
      this.form.controls.permite_venta_fraccionada.disable({ emitEvent: false });
    } else {
      this.form.controls.permite_venta_fraccionada.enable({ emitEvent: false });
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
              this.form.controls.unidad_medida_id.markAsDirty();
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

  /** Mantiene sincronizado el campo denormalizado `imagen_url` cuando cambia la portada de la galería. */
  onImagenPrincipalCambiada(url: string | null) {
    const id = this.sheetData?.productoId;
    if (!id) return;
    this.productoService
      .actualizar(id, { imagen_url: url, cambiar_imagen_url: true })
      .subscribe({
        next: () => this.sheetData?.onSaved?.(),
        error: err => console.error('No se pudo sincronizar la portada', err),
      });
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
    // getRawValue() para incluir permite_venta_fraccionada/incremento_minimo_venta
    // aunque el control esté deshabilitado (tipo kit/servicio/fraccionable forzado).
    const data = { ...this.form.getRawValue() } as any;
    delete data.existencias;

    if (data.codigo_barras === '') data.codigo_barras = null;
    if (data.descripcion === '') data.descripcion = null;
    if (data.unidad_medida_id === '') data.unidad_medida_id = null;
    if (data.incremento_minimo_venta === '' || data.incremento_minimo_venta == null) {
      data.incremento_minimo_venta = null;
    } else {
      data.incremento_minimo_venta = Number(data.incremento_minimo_venta);
    }

    let request$: Observable<any>;

    if (this.sheetData?.productoId) {
      const updateData = { ...data };
      delete updateData.activo; // Not in the update schema

      updateData.cambiar_codigo_barras = this.form.get('codigo_barras')?.dirty ?? false;
      updateData.cambiar_descripcion = this.form.get('descripcion')?.dirty ?? false;
      updateData.cambiar_unidad_medida_id = this.form.get('unidad_medida_id')?.dirty ?? false;
      updateData.cambiar_incremento_minimo_venta = this.form.get('incremento_minimo_venta')?.dirty ?? false;

      // Ensure numeric fields are numbers
      updateData.precio_venta = Number(updateData.precio_venta);
      updateData.costo = Number(updateData.costo);
      updateData.impuesto_tasa = Number(updateData.impuesto_tasa);

      request$ = this.productoService.actualizar(this.sheetData.productoId, updateData);
    } else {
      request$ = this.productoService.crear(data).pipe(
        switchMap((prodRes: any) => {
          const rowOps: Observable<any>[] = [];
          
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
              rowOps.push(movObs$);
            } else if (stock_minimo > 0 || stock_maximo > 0) {
              this.sonner.warning('Algunos umbrales fueron ignorados porque requieren registrar un stock inicial mayor a 0 primero.');
            }
          });

          if (rowOps.length > 0) {
            return forkJoin(rowOps).pipe(map(() => prodRes));
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
