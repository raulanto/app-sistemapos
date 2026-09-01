import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CategoriaService } from '../data-access/categoria.service';
import { CategoriaResponse } from '../data-access/inventario.models';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Categorías</h1>
        <button class="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm">
          Nueva Categoría
        </button>
      </div>

      <div class="bg-card border rounded-lg overflow-hidden">
        <table class="w-full text-sm text-left">
          <thead class="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th class="px-6 py-3">Nombre</th>
              <th class="px-6 py-3">Estado</th>
              <th class="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (categoria of categorias(); track categoria.id) {
              <tr class="border-t hover:bg-muted/50">
                <td class="px-6 py-4 font-medium">{{ categoria.nombre }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 text-xs rounded-full" 
                        [class.bg-green-100]="categoria.activo"
                        [class.text-green-800]="categoria.activo"
                        [class.bg-red-100]="!categoria.activo"
                        [class.text-red-800]="!categoria.activo">
                    {{ categoria.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-primary hover:underline">Editar</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="px-6 py-8 text-center text-muted-foreground">
                  No hay categorías registradas
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
export class CategoriaListComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  
  readonly categorias = signal<CategoriaResponse[]>([]);

  ngOnInit() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al cargar categorias:', err)
    });
  }
}
