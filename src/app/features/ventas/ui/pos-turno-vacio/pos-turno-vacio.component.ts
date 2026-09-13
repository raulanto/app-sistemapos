import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBanknote, lucideLockKeyhole } from '@ng-icons/lucide';

import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-pos-turno-vacio',
  standalone: true,
  imports: [NgIconComponent, ZardButtonComponent],
  viewProviders: [provideIcons({ lucideBanknote, lucideLockKeyhole })],
  template: `
    <div class="grid flex-1 place-items-center p-8">
      <div class="max-w-sm text-center">
        <div class="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ng-icon name="lucideLockKeyhole" class="size-6" />
        </div>
        <h2 class="mt-4 text-xl font-semibold">No hay caja abierta</h2>
        <p class="mt-1 text-sm text-muted-foreground">Abre un turno declarando el efectivo inicial para empezar a vender.</p>
        @if (canOperarCaja()) {
          <button z-button zType="default" class="mt-4" (click)="abrirCaja.emit()">
            <ng-icon name="lucideBanknote" class="mr-2 size-4" /> Abrir caja
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class PosTurnoVacioComponent {
  readonly canOperarCaja = input(false);
  readonly abrirCaja = output<void>();
}
