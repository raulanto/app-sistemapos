import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBanknote, lucideScale, lucideWallet } from '@ng-icons/lucide';

import { CajaService } from '../data-access/caja.service';
import {
  CajaTurnoResponse,
  EstadoCajaTurno,
  ESTADOS_TURNO,
  TurnoHistoricoQuery,
} from '../data-access/ventas.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';
import { SucursalService } from '@/core/sucursal/sucursal.service';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ConciliarTurnoSheetComponent } from '../ui/conciliar-turno-sheet/conciliar-turno-sheet.component';

@Component({
  selector: 'app-turnos-historico',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
    NgIconComponent,
    ...ZardTableImports,
    ...ZardSelectImports,
    ...ZardCardImports,
    ZardInputComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [provideIcons({ lucideBanknote, lucideScale, lucideWallet })],
  templateUrl: './turnos-historico.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnosHistoricoComponent {
  private cajaService = inject(CajaService);
  private authService = inject(AuthService);
  private sucursalService = inject(SucursalService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);

  readonly estados = ESTADOS_TURNO;
  readonly canConciliar = computed(() => this.authService.hasPermission(...PERMISOS.caja.autorizarDiferencia));

  readonly turnos = signal<CajaTurnoResponse[]>([]);
  readonly loading = signal(true);
  readonly efectivoActual = signal<string | null>(null);

  readonly filtroEstado = signal<EstadoCajaTurno | ''>('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly refresh = signal(0);

  private readonly query = computed<TurnoHistoricoQuery>(() => {
    this.refresh();
    return {
      estado: this.filtroEstado() || undefined,
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
      page_size: 100,
      sort: 'abierto_en:desc',
    };
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => this.loading.set(true)),
        debounceTime(300),
        switchMap(q => this.cajaService.historico(q)),
      )
      .subscribe({
        next: res => {
          this.turnos.set(res.data);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar el histórico de turnos', err);
          this.loading.set(false);
        },
      });

    this.cajaService.efectivoActual(this.sucursalService.selectedSucursalId()).subscribe({
      next: r => this.efectivoActual.set(r.efectivo_esperado),
      error: () => this.efectivoActual.set(null),
    });
  }

  badgeTipo(estado: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (estado === 'abierto') return 'default';
    if (estado === 'cerrado_con_diferencia') return 'destructive';
    if (estado === 'conciliado') return 'outline';
    return 'secondary';
  }

  etiquetaEstado(estado: string): string {
    return this.estados.find(e => e.value === estado)?.label ?? estado;
  }

  conciliar(turno: CajaTurnoResponse) {
    this.sheetService.create({
      zTitle: `Conciliar turno`,
      zDescription: 'Revisá la diferencia y autorizá el cierre.',
      zContent: ConciliarTurnoSheetComponent,
      zData: { turno },
      zOkText: 'Conciliar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => {
        const obs = i.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Turno conciliado');
              this.refresh.update(v => v + 1);
              resolve();
            },
            error: (err: any) => {
              this.sonner.error(err?.error?.error?.message ?? 'No se pudo conciliar el turno');
              reject(err);
            },
          });
        });
      },
    });
  }
}
