import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

import { ClienteResponse } from '../../data-access/ventas.models';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-pos-cliente-credito',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, NgIconComponent, ZardButtonComponent, ZardInputComponent],
  viewProviders: [provideIcons({ lucideX })],
  template: `
    <div class="rounded-md border border-amber-500/40 bg-amber-500/5 p-2">
      @if (cliente(); as c) {
        <div class="flex items-center justify-between text-sm">
          <span><span class="font-medium">{{ c.nombre }}</span> · disp. {{ (+c.limite_credito - +c.saldo_credito) | currency }}</span>
          <button z-button zType="ghost" zSize="icon-sm" (click)="quitarCliente.emit()"><ng-icon name="lucideX" class="size-4" /></button>
        </div>
      } @else {
        <div class="relative">
          <input z-input placeholder="Buscar cliente para el crédito…" [ngModel]="clienteBusqueda()" (ngModelChange)="busquedaChange.emit($event)" />
          @if (clientesEncontrados().length) {
            <ul class="absolute bottom-full z-10 mb-1 max-h-40 w-full overflow-y-auto rounded-md border bg-popover shadow">
              @for (c of clientesEncontrados(); track c.id) {
                <li>
                  <button type="button" class="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-sm hover:bg-accent" (click)="elegirCliente.emit(c)">
                    <span>{{ c.nombre }}</span>
                    <span class="text-xs text-muted-foreground">disp. {{ (+c.limite_credito - +c.saldo_credito) | currency }}</span>
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class PosClienteCreditoComponent {
  readonly cliente = input<ClienteResponse | null>(null);
  readonly clienteBusqueda = input('');
  readonly clientesEncontrados = input<ClienteResponse[]>([]);

  readonly busquedaChange = output<string>();
  readonly elegirCliente = output<ClienteResponse>();
  readonly quitarCliente = output<void>();
}
