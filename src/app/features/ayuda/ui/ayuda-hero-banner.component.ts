import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideSparkles, lucideX } from '@ng-icons/lucide';
import { ZardInputComponent } from '@/shared/components/input/input.component';

@Component({
  selector: 'app-ayuda-hero-banner',
  imports: [CommonModule, FormsModule, NgIcon, ZardInputComponent],
  viewProviders: [provideIcons({ lucideSparkles, lucideSearch, lucideX })],
  template: `
    <div class="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-12 shadow-2xs mb-8 text-foreground">
      <div class="h-1.5 w-full bg-primary absolute top-0 left-0 right-0"></div>

      <div class="relative z-10 max-w-2xl mx-auto text-center space-y-5 pt-2">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-wide">
          <ng-icon name="lucideSparkles" class="text-primary text-sm" />
          <span>Centro de Ayuda y Guías POS</span>
        </div>

        <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
          ¿En qué podemos ayudarte?
        </h1>

        <p class="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          Encuentra respuestas rápidas, manuales paso a paso y guías de uso para cada módulo de tu punto de venta.
        </p>

        <!-- Buscador con colores sólidos y alto contraste -->
        <div class="relative max-w-xl mx-auto pt-2">
          <ng-icon name="lucideSearch" class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl" />
          <input
            z-input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQueryChange.emit($event)"
            placeholder="Buscar guías o artículos (ej. ventas, arqueo, stock, lotes)..."
            class="w-full pl-12 pr-10 py-3.5 text-sm md:text-base rounded-2xl bg-muted/50 hover:bg-muted/80 focus:bg-background text-foreground placeholder:text-muted-foreground border border-border shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          />
          @if (searchQuery()) {
            <button
              type="button"
              (click)="searchQueryChange.emit('')"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted"
            >
              <ng-icon name="lucideX" />
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class AyudaHeroBannerComponent {
  readonly searchQuery = input<string>('');
  readonly searchQueryChange = output<string>();
}
