import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLayers,
  lucideMinus,
  lucidePackage,
  lucidePlus,
  lucideShoppingCart,
  lucideTag,
  lucideTrash,
  lucideTrash2,
} from '@ng-icons/lucide';

import { ProductoResponse, UnidadResponse } from '../../../inventario/data-access/inventario.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface LineaVista {
  key: string;
  producto: ProductoResponse;
  unidad: UnidadResponse | null;
  cantidad: number;
  precioUnitario: number;
  descuentoLinea: number;
  precioEfectivo: number;
  aplicaMayoreo: boolean;
  /** lineaSubtotal(l) − (promo?.descuento ?? 0) */
  subtotalMostrado: number;
  promo: { etiqueta: string; descuento: number } | null;
  promos: { promo_etiqueta: string; monto: string }[];
  sinStock: boolean;
  /** cantidad <= 0 */
  invalida: boolean;
}

@Component({
  selector: 'app-pos-carrito',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, NgIconComponent, ZardBadgeComponent, ZardButtonComponent, ZardEmptyComponent, ZardInputComponent],
  viewProviders: [
    provideIcons({
      lucideLayers,
      lucideMinus,
      lucidePackage,
      lucidePlus,
      lucideShoppingCart,
      lucideTag,
      lucideTrash,
      lucideTrash2,
    }),
  ],
  templateUrl: './pos-carrito.component.html',
  styles: [
    `
    .linea-detalle { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .22s ease; }
    .linea-detalle.abierta { grid-template-rows: 1fr; }
    .linea-detalle > div { overflow: hidden; min-height: 0; }
    @media (prefers-reduced-motion: reduce) {
      .linea-detalle { transition: none; }
    }
  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class PosCarritoComponent {
  readonly lineas = input<LineaVista[]>([]);
  readonly expandedLinea = input<string | null>(null);
  readonly canDescuentoManual = input(false);

  readonly quitar = output<string>();
  readonly setCantidad = output<{ key: string; cantidad: number }>();
  readonly pasoCantidad = output<{ key: string; delta: 1 | -1 }>();
  readonly setPrecio = output<{ key: string; precio: number }>();
  readonly setDescuentoLinea = output<{ key: string; descuento: number }>();
  readonly toggleLinea = output<string>();
  readonly vaciarCarrito = output<void>();

  /** ids de productos cuya imagen falló al cargar (independiente del catálogo). */
  readonly imgRoto = signal<Set<string>>(new Set());

  imgSrc(l: LineaVista): string | null {
    const roto = this.imgRoto();
    const candidatos = [
      l.unidad?.imagen_principal?.url,
      l.unidad?.imagen_principal?.thumbnail_url,
      l.producto.imagen_principal?.url,
      l.producto.imagen_principal?.thumbnail_url,
    ];
    return candidatos.find((u): u is string => !!u && !roto.has(u)) ?? null;
  }
  marcarImgRota(src: string | null) {
    if (src) this.imgRoto.update(s => new Set(s).add(src));
  }
}
