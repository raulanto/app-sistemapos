import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCalendar,
  lucideCalendarClock,
  lucideCalendarDays,
  lucideCheck,
  lucidePlus,
  lucideRefreshCw,
  lucideX,
} from '@ng-icons/lucide';

import { CitaService } from '../data-access/services/cita.service';
import { CitaResponse, ESTADOS_CITA, EstadoCita, mensajeCitaError } from '../data-access/agenda.models';
import { ProductoService } from '../../inventario/data-access/producto.service';
import { ProductoResponse } from '../../inventario/data-access/models/producto.model';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardPopoverImports } from '../../../shared/components/popover/popover.imports';
import { ZardCalendarComponent } from '../../../shared/components/calendar/calendar.component';
import { ZardPaginationImports } from '../../../shared/components/pagination/pagination.imports';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { CrearCitaSheetComponent } from '../ui/crear-cita-sheet/crear-cita-sheet.component';

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-cita-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    NgIconComponent,
    ...ZardTableImports,
    ...ZardSelectImports,
    ...ZardPopoverImports,
    ...ZardPaginationImports,
    ZardCalendarComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({ lucideCalendar, lucideCalendarClock, lucideCalendarDays, lucideCheck, lucidePlus, lucideRefreshCw, lucideX }),
  ],
  templateUrl: './cita-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitaListComponent {
  private citaService = inject(CitaService);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private router = inject(Router);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.agenda.gestionar));
  readonly canResponder = computed(() => this.authService.hasPermission(...PERMISOS.agenda.responderOferta));

  readonly estados = ESTADOS_CITA;

  readonly citas = signal<CitaResponse[]>([]);
  readonly misOfertas = signal<CitaResponse[]>([]);
  readonly loading = signal(true);
  readonly respondiendo = signal<string | null>(null);

  readonly servicios = signal<ProductoResponse[]>([]);
  readonly servicioNombre = computed(() => Object.fromEntries(this.servicios().map(s => [s.id, s.nombre])));

  readonly fecha = signal(hoyISO());
  readonly selectedDate = signal<Date | null>(new Date());
  readonly estado = signal<EstadoCita | ''>('');
  readonly servicioId = signal('');

  readonly fechaTexto = computed(() => {
    const f = this.fecha();
    if (!f) return 'Todas las fechas';
    if (f === hoyISO()) return 'Hoy';
    const parts = f.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return f;
  });

  readonly hayFiltros = computed(() => !!this.estado() || !!this.servicioId() || this.fecha() !== hoyISO());

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const w: number[] = [];
    for (let i = start; i <= end; i++) w.push(i);
    return w;
  });

  constructor() {
    this.cargar();
    this.cargarMisOfertas();
    this.productoService.listar({ page_size: 100 }).subscribe({
      next: res => this.servicios.set(res.data.filter(p => (p.tipo || 'simple') === 'servicio')),
      error: () => {},
    });
  }

  cargar() {
    this.loading.set(true);
    this.citaService
      .listarCitas({
        estado: this.estado() || undefined,
        servicio_id: this.servicioId() || undefined,
        desde: this.fecha() ? `${this.fecha()}T00:00:00` : undefined,
        hasta: this.fecha() ? `${this.fecha()}T23:59:59` : undefined,
        page: this.page(),
        page_size: this.pageSize(),
        sort: 'fecha_hora_inicio:asc',
        include: 'cliente,empleado',
      })
      .subscribe({
        next: res => {
          this.citas.set(res.data);
          const p = res.meta?.pagination;
          this.totalItems.set(p?.total_items ?? res.data.length);
          this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
          if (p?.page && p.page !== this.page()) this.page.set(p.page);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar citas', err);
          this.loading.set(false);
        },
      });
  }

  private cargarMisOfertas() {
    if (!this.canResponder()) return;
    this.citaService.listarCitas({ estado: 'por_asignar', page_size: 50, sort: 'fecha_hora_inicio:asc' }).subscribe({
      next: res => {
        const miId = this.authService.currentUser()?.id;
        this.misOfertas.set(
          res.data.filter(c => c.asignaciones.some(a => a.empleado_id === miId && a.estado === 'ofrecida')),
        );
      },
      error: () => this.misOfertas.set([]),
    });
  }

  private recargarDesdeInicio() {
    this.page.set(1);
    this.cargar();
  }

  onDateChange(val: any) {
    if (val instanceof Date) {
      this.selectedDate.set(val);
      const dp = new DatePipe('en-US');
      const iso = dp.transform(val, 'yyyy-MM-dd') ?? '';
      this.fecha.set(iso);
      this.recargarDesdeInicio();
    } else {
      this.limpiarFechas();
    }
  }

  limpiarFechas() {
    this.selectedDate.set(null);
    this.fecha.set('');
    this.recargarDesdeInicio();
  }

  setFecha(v: string) {
    this.fecha.set(v);
    if (v) {
      const parts = v.split('-');
      if (parts.length === 3) {
        this.selectedDate.set(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      }
    } else {
      this.selectedDate.set(null);
    }
    this.recargarDesdeInicio();
  }
  setEstado(v: string) {
    this.estado.set(v as EstadoCita | '');
    this.recargarDesdeInicio();
  }
  setServicio(v: string) {
    this.servicioId.set(v);
    this.recargarDesdeInicio();
  }
  limpiarFiltros() {
    this.fecha.set(hoyISO());
    this.selectedDate.set(new Date());
    this.estado.set('');
    this.servicioId.set('');
    this.recargarDesdeInicio();
  }
  verTodas() {
    this.fecha.set('');
    this.selectedDate.set(null);
    this.recargarDesdeInicio();
  }

  setPageSize(v: string) {
    this.pageSize.set(Number(v) || 20);
    this.recargarDesdeInicio();
  }
  irAPagina(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.cargar();
  }
  prev() {
    this.irAPagina(this.page() - 1);
  }
  next() {
    this.irAPagina(this.page() + 1);
  }

  refrescar() {
    this.cargar();
    this.cargarMisOfertas();
  }

  crear() {
    this.sheetService.create({
      zTitle: 'Nueva cita',
      zDescription: 'Se oferta automáticamente a los empleados calificados y libres.',
      zContent: CrearCitaSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => {
        const obs = i.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (cita: CitaResponse) => {
              const n = cita.asignaciones.length;
              this.sonner.success(n > 0 ? `Cita creada · ofertada a ${n} empleado(s)` : 'Cita creada · sin empleados disponibles');
              this.refrescar();
              resolve();
              this.router.navigate(['/agenda', cita.id]);
            },
            error: (err: unknown) => {
              this.sonner.error(mensajeCitaError(err, 'No se pudo crear la cita'));
              reject(err);
            },
          });
        });
      },
    });
  }

  aceptar(cita: CitaResponse) {
    if (this.respondiendo()) return;
    this.respondiendo.set(cita.id);
    this.citaService.aceptar(cita.id).subscribe({
      next: () => {
        this.sonner.success('Cita aceptada');
        this.respondiendo.set(null);
        this.refrescar();
      },
      error: err => {
        this.respondiendo.set(null);
        this.sonner.error(mensajeCitaError(err, 'No se pudo aceptar la cita'));
        this.cargarMisOfertas();
      },
    });
  }

  rechazar(cita: CitaResponse) {
    if (this.respondiendo()) return;
    this.respondiendo.set(cita.id);
    this.citaService.rechazar(cita.id).subscribe({
      next: () => {
        this.sonner.success('Oferta rechazada');
        this.respondiendo.set(null);
        this.refrescar();
      },
      error: err => {
        this.respondiendo.set(null);
        this.sonner.error(mensajeCitaError(err, 'No se pudo rechazar la oferta'));
        this.cargarMisOfertas();
      },
    });
  }

  nombreServicio(id: string): string {
    return this.servicioNombre()[id] ?? id.slice(0, 8);
  }

  estadoBadge(e: EstadoCita): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'completada') return 'default';
    if (e === 'cancelada' || e === 'no_show' || e === 'sin_empleado_disponible') return 'destructive';
    if (e === 'asignada' || e === 'en_proceso') return 'secondary';
    return 'outline';
  }
  labelEstado(e: string) {
    return this.estados.find(x => x.value === e)?.label ?? e;
  }
}
