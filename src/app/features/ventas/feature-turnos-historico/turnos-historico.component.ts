import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBanknote, lucideScale, lucideWallet, lucideCalendar, lucideX, lucideAlertTriangle, lucideCheckCircle2, lucideClock, lucideHistory } from '@ng-icons/lucide';

import { CajaService } from '../data-access/caja.service';
import { UsuarioAdminService } from '../../usuarios/data-access/usuario-admin.service';
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
import { ZardPopoverImports } from '../../../shared/components/popover/popover.imports';
import { ZardCalendarComponent } from '../../../shared/components/calendar/calendar.component';
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
    ...ZardPopoverImports,
    ZardCalendarComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideBanknote,
      lucideScale,
      lucideWallet,
      lucideCalendar,
      lucideX,
      lucideAlertTriangle,
      lucideCheckCircle2,
      lucideClock,
      lucideHistory,
    }),
  ],
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
  readonly canConciliar = computed(() =>
    this.authService.hasPermission(...PERMISOS.caja.autorizarDiferencia),
  );

  readonly turnos = signal<CajaTurnoResponse[]>([]);
  readonly loading = signal(true);
  readonly efectivoActual = signal<string | null>(null);

  readonly cajasMap = signal<Map<string, string>>(new Map());
  readonly usuariosMap = signal<Map<string, string>>(new Map());

  readonly filtroEstado = signal<EstadoCajaTurno | 'ALL'>('ALL');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly refresh = signal(0);

  readonly datePickerOpen = signal(false);
  readonly dateRange = signal<Date[] | null>(null);

  readonly rangoTexto = computed(() => {
    const range = this.dateRange();
    if (!range || range.length === 0) return 'Filtrar por fechas';
    const dp = new DatePipe('en-US');
    const startStr = dp.transform(range[0], 'dd/MM/yyyy');
    if (range.length === 1) return startStr;
    const endStr = dp.transform(range[1], 'dd/MM/yyyy');
    return `${startStr} - ${endStr}`;
  });

  // KPIs derivados del listado cargado
  readonly turnosAbiertosCount = computed(() =>
    this.turnos().filter((t) => t.estado === 'abierto').length,
  );
  readonly turnosConDiferenciaCount = computed(() =>
    this.turnos().filter((t) => t.estado === 'cerrado_con_diferencia').length,
  );
  readonly turnosConciliadosCount = computed(() =>
    this.turnos().filter((t) => t.estado === 'conciliado' || t.estado === 'cerrado').length,
  );

  readonly hayFiltros = computed(
    () => (!!this.filtroEstado() && this.filtroEstado() !== 'ALL') || !!this.desde() || !!this.hasta(),
  );

  private readonly query = computed<TurnoHistoricoQuery>(() => {
    this.refresh();
    const estadoVal = this.filtroEstado();
    return {
      estado: estadoVal && estadoVal !== 'ALL' ? estadoVal : undefined,
      desde: this.desde() ? `${this.desde()}T00:00:00` : undefined,
      hasta: this.hasta() ? `${this.hasta()}T23:59:59` : undefined,
      page_size: 100,
      sort: 'abierto_en:desc',
    };
  });

  onDateRangeChange(val: any) {
    if (Array.isArray(val) && val.length > 0) {
      this.dateRange.set(val);
      const dp = new DatePipe('en-US');
      const start = val[0] ? (dp.transform(val[0], 'yyyy-MM-dd') ?? '') : '';
      const end = val.length > 1 && val[1] ? (dp.transform(val[1], 'yyyy-MM-dd') ?? start) : start;
      this.desde.set(start);
      this.hasta.set(end);
      if (val.length === 2) {
        this.datePickerOpen.set(false);
      }
    } else {
      this.dateRange.set(null);
      this.desde.set('');
      this.hasta.set('');
    }
  }

  limpiarFechas() {
    this.dateRange.set(null);
    this.desde.set('');
    this.hasta.set('');
  }

  limpiarTodosFiltros() {
    this.filtroEstado.set('ALL');
    this.limpiarFechas();
  }

  private usuarioAdminService = inject(UsuarioAdminService);

  constructor() {
    this.cajaService.listarCajas(true).subscribe({
      next: (cajas) => {
        const map = new Map<string, string>();
        cajas.forEach((c) => map.set(c.id, c.nombre));
        this.cajasMap.set(map);
      },
      error: (err) => console.error('Error al cargar cajas', err),
    });

    this.usuarioAdminService.listar({ page_size: 100 }).subscribe({
      next: (res) => {
        const map = new Map<string, string>();
        res.data.forEach((u) => map.set(u.id, u.nombre));
        this.usuariosMap.set(map);
      },
      error: (err) => console.error('Error al cargar usuarios', err),
    });

    toObservable(this.query)
      .pipe(
        tap(() => this.loading.set(true)),
        debounceTime(300),
        switchMap((q) => this.cajaService.historico(q)),
      )
      .subscribe({
        next: (res) => {
          this.turnos.set(res.data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar el histórico de turnos', err);
          this.loading.set(false);
        },
      });

    this.cajaService.efectivoActual(this.sucursalService.selectedSucursalId()).subscribe({
      next: (r) => this.efectivoActual.set(r.efectivo_esperado),
      error: () => this.efectivoActual.set(null),
    });
  }

  obtenerNombreTerminal(t: CajaTurnoResponse): string {
    if (t.caja?.nombre) return t.caja.nombre;
    if (t.caja_id && this.cajasMap().has(t.caja_id)) {
      return this.cajasMap().get(t.caja_id)!;
    }
    return '—';
  }

  obtenerNombreCajero(t: CajaTurnoResponse): string {
    if (t.usuario?.nombre) return t.usuario.nombre;
    if (t.usuario_id && this.usuariosMap().has(t.usuario_id)) {
      return this.usuariosMap().get(t.usuario_id)!;
    }
    return '—';
  }

  badgeTipo(estado: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (estado === 'abierto') return 'default';
    if (estado === 'cerrado_con_diferencia') return 'destructive';
    if (estado === 'conciliado') return 'outline';
    return 'secondary';
  }

  etiquetaEstado(estado: string): string {
    return this.estados.find((e) => e.value === estado)?.label ?? estado;
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
              this.refresh.update((v) => v + 1);
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
