import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX } from '@ng-icons/lucide';

import { EstadoEntrega, TipoPedido } from '../../data-access/pedidos.models';

type PasoEstado = 'done' | 'actual' | 'pendiente' | 'fallido';
interface Paso {
  key: EstadoEntrega;
  label: string;
  estado: PasoEstado;
  /** El backend permite mover la entrega a este paso ahora → se puede pulsar. */
  accionable: boolean;
}

const LABEL: Record<EstadoEntrega, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  en_reparto: 'En reparto',
  entregado: 'Entregado',
  fallido: 'Fallido',
};

/**
 * Línea de tiempo horizontal del avance de la entrega (pendiente → … → entregado).
 * `domicilio` incluye el paso «En reparto»; `recoger` lo salta. `fallido` marca el
 * final en rojo. Si `siguientes` trae transiciones válidas, esos pasos se vuelven
 * botones y emiten `avanzar`; el padre hace la llamada.
 */
@Component({
  selector: 'app-pedido-entrega-timeline',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ lucideCheck, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="flex items-start">
      @for (paso of pasos(); track paso.key; let last = $last; let i = $index) {
        <li class="flex items-center" [class.flex-1]="!last">
          <button
            type="button"
            class="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
            [class.cursor-pointer]="paso.accionable && !avanzando()"
            [class.cursor-default]="!paso.accionable || avanzando()"
            [disabled]="!paso.accionable || avanzando()"
            [attr.aria-current]="paso.estado === 'actual' ? 'step' : null"
            [title]="paso.accionable ? 'Marcar como ' + paso.label : ''"
            (click)="avanzar.emit(paso.key)">
            <span
              class="grid size-7 place-items-center rounded-full border-2 text-xs font-semibold transition-colors"
              [class.border-primary]="paso.estado === 'done' || paso.estado === 'actual'"
              [class.bg-primary]="paso.estado === 'done'"
              [class.text-primary-foreground]="paso.estado === 'done'"
              [class.text-primary]="paso.estado === 'actual'"
              [class.border-destructive]="paso.estado === 'fallido'"
              [class.bg-destructive]="paso.estado === 'fallido'"
              [class.text-white]="paso.estado === 'fallido'"
              [class.border-border]="paso.estado === 'pendiente'"
              [class.text-muted-foreground]="paso.estado === 'pendiente'"
              [class.ring-2]="paso.accionable && !avanzando()"
              [class.ring-primary]="paso.accionable && !avanzando()"
              [class.ring-offset-2]="paso.accionable && !avanzando()"
              [class.ring-offset-background]="paso.accionable && !avanzando()">
              @if (paso.estado === 'done') {
                <ng-icon name="lucideCheck" class="size-4" />
              } @else if (paso.estado === 'fallido') {
                <ng-icon name="lucideX" class="size-4" />
              } @else {
                {{ i + 1 }}
              }
            </span>
            <span
              class="text-center text-[0.7rem] font-medium leading-tight"
              [class.text-foreground]="paso.estado === 'actual' || paso.estado === 'done'"
              [class.text-destructive]="paso.estado === 'fallido'"
              [class.text-muted-foreground]="paso.estado === 'pendiente'">
              {{ paso.label }}
            </span>
          </button>
          @if (!last) {
            <span
              class="mx-1 mt-3.5 h-0.5 flex-1 rounded transition-colors"
              [class.bg-primary]="paso.estado === 'done'"
              [class.bg-border]="paso.estado !== 'done'"></span>
          }
        </li>
      }
    </ol>

    @if (puedeFallar() && !avanzando()) {
      <button
        type="button"
        class="mt-2 text-[0.7rem] font-medium text-destructive hover:underline"
        (click)="avanzar.emit('fallido')">
        Marcar entrega fallida
      </button>
    }
  `,
})
export class PedidoEntregaTimelineComponent {
  readonly tipo = input.required<TipoPedido>();
  readonly estado = input<EstadoEntrega | null>(null);
  /** Transiciones válidas desde el estado actual (del backend, vía `siguientesEstadosEntrega`). */
  readonly siguientes = input<EstadoEntrega[]>([]);
  readonly avanzando = input(false);

  readonly avanzar = output<EstadoEntrega>();

  readonly puedeFallar = computed(() => this.siguientes().includes('fallido'));

  readonly pasos = computed<Paso[]>(() => {
    const flujo: EstadoEntrega[] =
      this.tipo() === 'domicilio'
        ? ['pendiente', 'en_preparacion', 'en_reparto', 'entregado']
        : ['pendiente', 'en_preparacion', 'entregado'];
    const actual = this.estado();
    const permitidos = new Set(this.siguientes());

    if (actual === 'fallido') {
      const ultimo = flujo.length - 1;
      return flujo.map((key, i) => ({
        key,
        label: i === ultimo ? 'Fallido' : LABEL[key],
        estado: i === ultimo ? 'fallido' : 'done',
        accionable: permitidos.has(key),
      }));
    }

    const idx = actual ? flujo.indexOf(actual) : -1;
    return flujo.map((key, i) => ({
      key,
      label: LABEL[key],
      estado: actual === 'entregado' || i < idx ? 'done' : i === idx ? 'actual' : 'pendiente',
      accionable: permitidos.has(key),
    }));
  });
}
