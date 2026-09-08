import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideWallet, lucideSearch, lucidePlus, lucideArrowUpDown } from '@ng-icons/lucide';

import { ClienteService } from '../data-access/cliente.service';
import { MonederoResponse, MovimientoMonederoResponse } from '../data-access/clientes.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { MonederoAjusteSheetComponent } from '../ui/monedero-ajuste-sheet/monedero-ajuste-sheet.component';

@Component({
  selector: 'app-monedero',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    NgIconComponent,
    ...ZardTableImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardInputComponent,
  ],
  viewProviders: [provideIcons({ lucideWallet, lucideSearch, lucidePlus, lucideArrowUpDown })],
  templateUrl: './monedero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonederoComponent {
  private clienteService = inject(ClienteService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canAjustar = computed(() => this.authService.hasPermission(...PERMISOS.monedero.ajustar));

  readonly telefono = signal('');
  readonly buscado = signal('');
  readonly loading = signal(false);
  readonly monedero = signal<MonederoResponse | null>(null);
  readonly movimientos = signal<MovimientoMonederoResponse[]>([]);
  /** true tras una búsqueda que no encontró monedero para ese teléfono. */
  readonly noExiste = signal(false);

  readonly saldo = computed(() => Number(this.monedero()?.saldo) || 0);

  buscar() {
    const tel = this.telefono().trim();
    if (tel.replace(/\D/g, '').length < 7) {
      this.sonner.error('Escribe un teléfono válido (7+ dígitos).');
      return;
    }
    this.loading.set(true);
    this.buscado.set(tel);
    this.noExiste.set(false);
    forkJoin({
      m: this.clienteService.monederoSaldo(tel),
      mov: this.clienteService
        .monederoMovimientos(tel, { page_size: 50, sort: 'created_at:desc' })
        .pipe(catchError(() => of({ success: true, data: [] as MovimientoMonederoResponse[] }))),
    }).subscribe({
      next: ({ m, mov }) => {
        this.monedero.set(m);
        this.movimientos.set(m ? mov.data : []);
        this.noExiste.set(!m);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al consultar el monedero', err);
        this.sonner.error(err?.error?.error?.message ?? 'No se pudo consultar el monedero');
        this.loading.set(false);
      },
    });
  }

  recargar() {
    if (this.buscado()) {
      this.telefono.set(this.buscado());
      this.buscar();
    }
  }

  ajustar() {
    const tel = this.buscado();
    if (!tel) return;
    this.sheetService.create({
      zTitle: 'Ajustar monedero',
      zDescription: `Carga o corrige el saldo de ${tel}.`,
      zContent: MonederoAjusteSheetComponent,
      zData: { telefono: tel, saldoActual: this.saldo() },
      zOkText: 'Aplicar ajuste',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => {
        const obs = i.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Saldo ajustado');
              this.recargar();
              resolve();
            },
            error: (err: any) => {
              this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? 'No se pudo ajustar el saldo');
              reject(err);
            },
          });
        });
      },
    });
  }

  signo(m: MovimientoMonederoResponse): number {
    return Number(m.monto) || 0;
  }
}
