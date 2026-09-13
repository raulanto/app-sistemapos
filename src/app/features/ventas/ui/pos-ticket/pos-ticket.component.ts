import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucidePlus, lucidePrinter } from '@ng-icons/lucide';

import { VentaResponse } from '../../data-access/ventas.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-pos-ticket',
  standalone: true,
  imports: [CurrencyPipe, NgIconComponent, ZardBadgeComponent, ZardButtonComponent],
  viewProviders: [provideIcons({ lucideCircleCheck, lucidePlus, lucidePrinter })],
  templateUrl: './pos-ticket.component.html',
  styles: [
    `
    @keyframes pos-feed {
      from { clip-path: inset(100% 0 0 0); }
      to { clip-path: inset(0 0 0 0); }
    }
    @keyframes pos-drop {
      0% { transform: translateY(-8px); }
      55% { transform: translateY(4px); }
      100% { transform: translateY(0); }
    }
    @keyframes pos-slot {
      0%, 100% { opacity: .35; transform: scaleX(.9); }
      50% { opacity: .9; transform: scaleX(1); }
    }
    @keyframes pos-actions-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .pos-slot { animation: pos-slot 1s ease-in-out 3; }
    .pos-ticket {
      transform-origin: top center;
      animation: pos-feed 1s cubic-bezier(.2, .9, .25, 1) both, pos-drop .5s ease-out .95s both;
      --tooth: 12px;
      -webkit-mask:
        conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / var(--tooth) var(--tooth) repeat-x,
        linear-gradient(#000 0 0) top / 100% calc(100% - var(--tooth)) no-repeat;
      mask:
        conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / var(--tooth) var(--tooth) repeat-x,
        linear-gradient(#000 0 0) top / 100% calc(100% - var(--tooth)) no-repeat;
    }
    .pos-ticket-actions { animation: pos-actions-in .3s ease-out 1.35s both; }
    @media (prefers-reduced-motion: reduce) {
      .pos-ticket, .pos-ticket-actions, .pos-slot { animation: none; }
    }
  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class PosTicketComponent {
  readonly venta = input.required<VentaResponse>();

  readonly imprimir = output<string>();
  readonly nuevaVenta = output<void>();

  /** Ahorro total por promociones de una venta ya registrada. */
  ahorroPromo(v: VentaResponse): number {
    return (v.lineas ?? []).reduce((s, l) => s + (Number(l.promo_descuento) || 0), 0);
  }

  /** Filas de promo para el ticket: el desglose si viene, si no la etiqueta única. */
  promosTicket(v: VentaResponse): { promo_etiqueta: string; monto: string }[] {
    return (v.lineas ?? []).flatMap(l => {
      if (l.promos_aplicadas?.length) return l.promos_aplicadas;
      if (l.promo_etiqueta && Number(l.promo_descuento) > 0) {
        return [{ promo_etiqueta: l.promo_etiqueta, monto: l.promo_descuento ?? '0' }];
      }
      return [];
    });
  }
}
