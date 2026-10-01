import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideArrowLeft, lucideHome, lucideSearch } from '@ng-icons/lucide';
import { ZardButtonComponent } from '@/shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, NgIcon, ZardButtonComponent],
  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideArrowLeft,
      lucideHome,
      lucideSearch,
    }),
  ],
  template: `
    <div class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center">
      <div class="relative flex items-center justify-center mb-6">
        <!-- Glow visual indicator -->
        <div class="absolute -inset-4 rounded-full bg-primary/10 blur-xl"></div>
        <div class="relative flex items-center justify-center size-24 rounded-2xl bg-card border border-border shadow-sm text-primary">
          <ng-icon name="lucideSearch" class="size-12 text-muted-foreground/80" />
          <span class="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow">
            404
          </span>
        </div>
      </div>

      <div class="max-w-md space-y-3">
        <h1 class="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Página no encontrada
        </h1>
        <p class="text-muted-foreground text-base">
          Lo sentimos, la ruta a la que intentas acceder no existe, ha sido movida o no tienes permisos para visualizarla.
        </p>
      </div>

      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <a z-button zType="outline" class="w-full sm:w-auto gap-2" routerLink="/dashboard">
          <ng-icon name="lucideHome" class="size-4" />
          Ir al Panel Principal
        </a>
        <button z-button zType="default" class="w-full sm:w-auto gap-2" (click)="goBack()">
          <ng-icon name="lucideArrowLeft" class="size-4" />
          Volver atrás
        </button>
      </div>

      <div class="mt-12 text-xs text-muted-foreground/60 border-t border-border/40 pt-4 w-full max-w-xs">
        Sistema POS &bull; Administración de Inventario y Usuarios
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
