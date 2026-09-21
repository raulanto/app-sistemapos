import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBoxes,
  lucideChartColumn,
  lucideClipboardList,
  lucideShoppingCart,
  lucideUserCog,
  lucideUserRound,
} from '@ng-icons/lucide';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { AyudaCategoria } from '../data-access/ayuda.models';

@Component({
  selector: 'app-ayuda-categoria-filter',
  imports: [CommonModule, NgIcon, ZardButtonComponent],
  viewProviders: [
    provideIcons({
      lucideShoppingCart,
      lucideBoxes,
      lucideClipboardList,
      lucideUserRound,
      lucideChartColumn,
      lucideUserCog,
    }),
  ],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Categorías</h2>
        @if (selectedCategoriaId()) {
          <button
            z-button
            zType="ghost"
            zSize="sm"
            (click)="categoriaSelected.emit(null)"
            class="text-xs font-semibold text-primary hover:underline h-auto p-0"
          >
            Limpiar filtro
          </button>
        }
      </div>

      <!-- Grid de categorías con espacios adecuados -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
        @for (cat of categorias(); track cat.id) {
          <button
            type="button"
            (click)="categoriaSelected.emit(cat.id === selectedCategoriaId() ? null : cat.id)"
            [class.bg-primary/10]="cat.id === selectedCategoriaId()"
            [class.border-primary]="cat.id === selectedCategoriaId()"
            [class.text-primary]="cat.id === selectedCategoriaId()"
            class="group p-5 md:p-6 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-md transition-all text-left flex flex-col justify-between space-y-4 shadow-2xs min-h-[110px]"
          >
            <div class="flex items-center justify-between w-full">
              <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                <ng-icon [name]="cat.icono" class="text-lg" />
              </div>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {{ cat.articulosCount }}
              </span>
            </div>
            <span class="font-bold text-xs md:text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
              {{ cat.titulo }}
            </span>
          </button>
        }
      </div>
    </div>
  `,
})
export class AyudaCategoriaFilterComponent {
  readonly categorias = input.required<AyudaCategoria[]>();
  readonly selectedCategoriaId = input<string | null>(null);
  readonly categoriaSelected = output<string | null>();
}
