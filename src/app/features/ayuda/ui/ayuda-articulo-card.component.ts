import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight } from '@ng-icons/lucide';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { AyudaArticulo } from '../data-access/ayuda.models';

@Component({
  selector: 'app-ayuda-articulo-card',
  imports: [CommonModule, NgIcon, ZardBadgeComponent],
  viewProviders: [provideIcons({ lucideChevronRight })],
  template: `
    <div
      (click)="articuloSelected.emit(articulo())"
      class="group p-6 md:p-8 rounded-3xl border bg-card hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-6 h-full shadow-2xs"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3 pb-1">
          <z-badge zVariant="secondary" class="text-xs px-3 py-1 font-semibold">
            {{ categoriaTitulo() }}
          </z-badge>
          <span class="text-xs text-muted-foreground font-medium">{{ articulo().ultimaActualizacion }}</span>
        </div>

        <h3 class="font-extrabold text-base md:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {{ articulo().titulo }}
        </h3>

        <p class="text-xs md:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {{ articulo().resumen }}
        </p>
      </div>

      <div class="flex items-center justify-between pt-5 border-t border-border/60 text-xs md:text-sm font-semibold text-primary">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Etiqueta:</span>
          <span class="font-bold text-foreground">#{{ articulo().tags[0] }}</span>
        </div>
        <div class="flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform font-bold">
          <span>Leer guía</span>
          <ng-icon name="lucideChevronRight" class="text-base" />
        </div>
      </div>
    </div>
  `,
})
export class AyudaArticuloCardComponent {
  readonly articulo = input.required<AyudaArticulo>();
  readonly categoriaTitulo = input<string>('General');
  readonly articuloSelected = output<AyudaArticulo>();
}
