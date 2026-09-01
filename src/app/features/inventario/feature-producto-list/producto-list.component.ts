import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../data-access/producto.service';
import { ProductoResponse } from '../data-access/inventario.models';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Productos</h1>
        <a routerLink="nuevo" class="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm">
          Nuevo Producto
        </a>
      </div>

      <div class="bg-card border rounded-lg overflow-hidden">
        <table class="w-full text-sm text-left">
          <thead class="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th class="px-6 py-3">SKU</th>
              <th class="px-6 py-3">Nombre</th>
              <th class="px-6 py-3">Precio</th>
              <th class="px-6 py-3">Stock</th>
              <th class="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (producto of productos(); track producto.id) {
              <tr class="border-t hover:bg-muted/50">
                <td class="px-6 py-4 font-medium">{{ producto.sku }}</td>
                <td class="px-6 py-4">{{ producto.nombre }}</td>
                <td class="px-6 py-4">{{ producto.precio_venta }}</td>
                <td class="px-6 py-4">
                  <!-- Mostrar cantidad del existencias object o un valor por defecto -->
                  0
                </td>
                <td class="px-6 py-4 text-right">
                  <a [routerLink]="['/inventario/productos', producto.id]" class="text-primary hover:underline">Editar</a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-8 text-center text-muted-foreground">
                  No hay productos registrados
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoListComponent implements OnInit {
  private productoService = inject(ProductoService);
  
  readonly productos = signal<ProductoResponse[]>([]);

  ngOnInit() {
    this.productoService.listar().subscribe({
      next: (data) => this.productos.set(data),
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }
}
