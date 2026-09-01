import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

import { ProductoService } from '../data-access/producto.service';
import { CategoriaService } from '../data-access/categoria.service';
import { CategoriaResponse } from '../data-access/inventario.models';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardFieldImports } from '../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterLink,
    ...ZardCardImports,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardButtonComponent
  ],
  template: `
    <div class="p-6 max-w-3xl mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/inventario/productos" class="text-muted-foreground hover:text-foreground">
          &larr; Volver
        </a>
        <h1 class="text-2xl font-bold tracking-tight">{{ isEditing() ? 'Editar' : 'Nuevo' }} Producto</h1>
      </div>

      <div z-card>
        <z-card-content class="pt-6">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div z-field>
                <label z-field-label for="sku">SKU *</label>
                <input z-input id="sku" type="text" formControlName="sku" placeholder="Ej. PRD-001">
              </div>
              <div z-field>
                <label z-field-label for="codigo_barras">Código de Barras</label>
                <input z-input id="codigo_barras" type="text" formControlName="codigo_barras" placeholder="Opcional">
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div z-field>
                <label z-field-label for="nombre">Nombre *</label>
                <input z-input id="nombre" type="text" formControlName="nombre" placeholder="Nombre del producto">
              </div>
              <div z-field>
                <label z-field-label>Categoría</label>
                <z-select formControlName="categoria_id" placeholder="Selecciona una categoría">
                  @for (cat of categorias(); track cat.id) {
                    <z-select-item [zValue]="cat.id">{{ cat.nombre }}</z-select-item>
                  }
                </z-select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div z-field>
                <label z-field-label for="precio_venta">Precio de Venta *</label>
                <input z-input id="precio_venta" type="number" step="0.01" formControlName="precio_venta" placeholder="0.00">
              </div>
              <div z-field>
                <label z-field-label for="costo">Costo *</label>
                <input z-input id="costo" type="number" step="0.01" formControlName="costo" placeholder="0.00">
              </div>
            </div>
            
            <div class="flex justify-end gap-2 pt-4">
              <a routerLink="/inventario/productos" z-button zType="outline">
                Cancelar
              </a>
              <button z-button zType="default" type="submit" [zDisabled]="form.invalid || isSubmitting()">
                {{ isSubmitting() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </z-card-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditing = signal(false);
  isSubmitting = signal(false);
  productId = signal<string | null>(null);
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
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.productId.set(id);
      this.productoService.obtenerPorId(id).subscribe({
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

  onSubmit() {
    if (this.form.invalid) return;
    
    this.isSubmitting.set(true);
    const data = this.form.value as any;
    const request = this.isEditing() && this.productId()
      ? this.productoService.actualizar(this.productId()!, data)
      : this.productoService.crear(data);

    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/inventario/productos']);
      },
      error: (err) => {
        console.error('Error guardando producto', err);
        this.isSubmitting.set(false);
      }
    });
  }
}
