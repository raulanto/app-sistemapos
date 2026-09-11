import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeftRight,
  lucideHistory,
  lucideLockKeyhole,
  lucideMaximize2,
  lucideMinimize2,
  lucideShoppingCart,
} from '@ng-icons/lucide';

import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { CajaTurnoResponse } from '../../data-access/ventas.models';

@Component({
  selector: 'app-pos-header',
  standalone: true,
  imports: [DatePipe, RouterLink, NgIconComponent, ZardBadgeComponent, ZardButtonComponent],
  viewProviders: [
    provideIcons({
      lucideArrowLeftRight,
      lucideHistory,
      lucideLockKeyhole,
      lucideMaximize2,
      lucideMinimize2,
      lucideShoppingCart,
    }),
  ],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
      <div class="flex items-center gap-2">
        <ng-icon name="lucideShoppingCart" class="size-5 text-primary" />
        <h1 class="text-lg font-bold tracking-tight">Punto de venta</h1>
        @if (turno(); as t) {
          <z-badge zType="secondary" class="ml-1">
            {{ t.caja?.nombre ? t.caja?.nombre + ' · ' : 'Caja abierta · ' }}{{ t.abierto_en | date: 'HH:mm' }}
          </z-badge>
        }
      </div>
      <div class="flex items-center gap-2">
        <a z-button zType="ghost" zSize="sm" routerLink="/ventas/historial">
          <ng-icon name="lucideHistory" class="mr-1.5 size-4" /> Historial
        </a>
        <button
          z-button
          zType="ghost"
          zSize="sm"
          [attr.title]="isFullscreen() ? 'Salir de pantalla completa' : 'Pantalla completa'"
          (click)="toggleFullscreen.emit()"
        >
          <ng-icon [name]="isFullscreen() ? 'lucideMinimize2' : 'lucideMaximize2'" class="size-4" />
        </button>
        @if (turno() && canOperarCaja()) {
          <button z-button zType="ghost" zSize="sm" (click)="abrirMovimientos.emit()">
            <ng-icon name="lucideArrowLeftRight" class="mr-1.5 size-4" /> Movimientos
          </button>
          <button z-button zType="outline" zSize="sm" (click)="cerrarCaja.emit()">
            <ng-icon name="lucideLockKeyhole" class="mr-1.5 size-4" /> Cerrar caja
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class PosHeaderComponent {
  readonly turno = input<CajaTurnoResponse | null>(null);
  readonly canOperarCaja = input(false);
  readonly isFullscreen = input(false);

  readonly abrirMovimientos = output<void>();
  readonly cerrarCaja = output<void>();
  readonly toggleFullscreen = output<void>();
}
