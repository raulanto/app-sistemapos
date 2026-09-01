import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from '../data-access/producto.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/inventario/productos" class="text-muted-foreground hover:text-foreground">
          &larr; Volver
        </a>
        <h1 class="text-2xl font-bold">{{ isEditing() ? 'Editar' : 'Nuevo' }} Producto</h1>
      </div>

      <div class="bg-card border rounded-lg p-6">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="sku" class="text-sm font-medium">SKU *</label>
              <input id="sku" type="text" formControlName="sku" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            </div>
            <div class="space-y-2">
              <label for="codigo_barras" class="text-sm font-medium">Código de Barras</label>
              <input id="codigo_barras" type="text" formControlName="codigo_barras" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            </div>
          </div>
          
          <div class="space-y-2">
            <label for="nombre" class="text-sm font-medium">Nombre *</label>
            <input id="nombre" type="text" formControlName="nombre" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          </div>

          <!-- Add more fields (categoria_id, precio_venta, costo, unidad_medida, etc.) later -->
          
          <div class="flex justify-end gap-2 pt-4">
            <a routerLink="/inventario/productos" class="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted">
              Cancelar
            </a>
            <button type="submit" [disabled]="form.invalid" class="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditing = signal(false);
  productId = signal<string | null>(null);

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

  onSubmit() {
    if (this.form.invalid) return;

    const data = this.form.value as any;
    const request = this.isEditing() && this.productId()
      ? this.productoService.actualizar(this.productId()!, data)
      : this.productoService.crear(data);

    request.subscribe({
      next: () => this.router.navigate(['/inventario/productos']),
      error: (err) => console.error('Error guardando producto', err)
    });
  }
}
