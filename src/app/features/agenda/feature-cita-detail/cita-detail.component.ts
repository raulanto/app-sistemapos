import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBan,
  lucideCalendarDays,
  lucideCheck,
  lucideCircleCheck,
  lucideReceiptText,
  lucideShuffle,
  lucideUserPlus,
  lucideUserX,
  lucideX,
} from '@ng-icons/lucide';

import { CitaService } from '../data-access/services/cita.service';
import { RecursoService } from '../data-access/services/recurso.service';
import {
  CitaResponse,
  EstadoAsignacion,
  EstadoCita,
  ESTADOS_ASIGNACION,
  ESTADOS_CITA,
  mensajeCitaError,
  RecursoResponse,
} from '../data-access/agenda.models';
import { ProductoService } from '../../inventario/data-access/producto.service';
import { ProductoResponse } from '../../inventario/data-access/models/producto.model';
import { UsuarioAdminService } from '../../usuarios/data-access/usuario-admin.service';
import { ClienteService } from '../../clientes/data-access/cliente.service';
import { CajaService } from '../../ventas/data-access/caja.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { CancelarCitaSheetComponent } from '../ui/cancelar-cita-sheet/cancelar-cita-sheet.component';
import { AsignarManualSheetComponent } from '../ui/asignar-manual-sheet/asignar-manual-sheet.component';
import { FacturarCitaSheetComponent } from '../ui/facturar-cita-sheet/facturar-cita-sheet.component';

@Component({
  selector: 'app-cita-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideBan,
      lucideCalendarDays,
      lucideCheck,
      lucideCircleCheck,
      lucideReceiptText,
      lucideShuffle,
      lucideUserPlus,
      lucideUserX,
      lucideX,
    }),
  ],
  templateUrl: './cita-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitaDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private citaService = inject(CitaService);
  private recursoService = inject(RecursoService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioAdminService);
  private clienteService = inject(ClienteService);
  private cajaService = inject(CajaService);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);
  private authService = inject(AuthService);

  readonly canGestionar = computed(() => this.authService.hasPermission(...PERMISOS.agenda.gestionar));
  readonly canResponder = computed(() => this.authService.hasPermission(...PERMISOS.agenda.responderOferta));

  readonly cita = signal<CitaResponse | null>(null);
  readonly servicio = signal<ProductoResponse | null>(null);
  readonly clienteNombre = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly working = signal(false);
  /** empleado_id -> nombre. Resuelto bajo demanda por id (ver `resolverEmpleados`). */
  readonly nombres = signal<Record<string, string>>({});
  readonly recursoNombre = signal<string | null>(null);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  private readonly miId = computed(() => this.authService.currentUser()?.id ?? null);

  readonly esMiCita = computed(() => !!this.cita() && this.cita()!.empleado_id === this.miId());
  readonly miOferta = computed(() =>
    (this.cita()?.asignaciones ?? []).find(a => a.empleado_id === this.miId() && a.estado === 'ofrecida'),
  );
  readonly puedeOperar = computed(() => this.canGestionar() || this.esMiCita());

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.citaService.obtenerCita(this.id).subscribe({
      next: c => {
        this.cita.set(c);
        this.loading.set(false);
        this.productoService.obtenerPorId(c.servicio_id).subscribe({
          next: p => this.servicio.set(p),
          error: () => {},
        });
        // `GET /agenda/citas/{id}` no acepta `?include` (a diferencia del listado) y no
        // embebe `cliente`/`empleado`/recurso: sólo llegan sus ids. Se resuelven aparte,
        // igual que el servicio, para no "perderlos" al entrar al detalle.
        if (c.cliente?.nombre) {
          this.clienteNombre.set(c.cliente.nombre);
        } else if (c.cliente_id) {
          this.clienteService.obtener(c.cliente_id).subscribe({
            next: cli => this.clienteNombre.set(cli.nombre),
            error: () => this.clienteNombre.set(null),
          });
        } else {
          this.clienteNombre.set(null);
        }
        this.resolverEmpleados(c);
        if (c.recurso_id) {
          this.recursoService.listarRecursos({ incluir_inactivos: true }).subscribe({
            next: recursos => this.recursoNombre.set(recursos.find((r: RecursoResponse) => r.id === c.recurso_id)?.nombre ?? null),
            error: () => this.recursoNombre.set(null),
          });
        } else {
          this.recursoNombre.set(null);
        }
      },
      error: err => {
        console.error('Error al cargar la cita', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Resuelve por id sólo los empleados que aparecen en esta cita (asignado + candidatos ofertados). */
  private resolverEmpleados(c: CitaResponse) {
    const ids = new Set<string>();
    if (c.empleado_id) ids.add(c.empleado_id);
    for (const a of c.asignaciones) ids.add(a.empleado_id);
    const conocidos = this.nombres();
    for (const id of ids) {
      if (conocidos[id]) continue;
      this.usuarioService.obtenerPorId(id).subscribe({
        next: u => this.nombres.update(m => ({ ...m, [id]: u.nombre })),
        error: () => {},
      });
    }
  }

  nombreEmpleado(id: string | null): string {
    if (!id) return 'Sin asignar';
    return this.nombres()[id] ?? id.slice(0, 8);
  }

  estadoBadge(e: EstadoCita): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'completada') return 'default';
    if (e === 'cancelada' || e === 'no_show' || e === 'sin_empleado_disponible') return 'destructive';
    if (e === 'asignada' || e === 'en_proceso') return 'secondary';
    return 'outline';
  }
  asignacionBadge(e: EstadoAsignacion): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'aceptada') return 'default';
    if (e === 'rechazada') return 'destructive';
    if (e === 'superada') return 'outline';
    return 'secondary';
  }
  labelEstado(e: string) {
    return ESTADOS_CITA.find(x => x.value === e)?.label ?? e;
  }
  labelAsignacion(e: string) {
    return ESTADOS_ASIGNACION.find(x => x.value === e)?.label ?? e;
  }

  private run(obs: import('rxjs').Observable<CitaResponse>, okMsg: string, errMsg: string) {
    if (this.working()) return;
    this.working.set(true);
    obs.subscribe({
      next: c => {
        this.cita.set(c);
        this.working.set(false);
        this.sonner.success(okMsg);
      },
      error: err => {
        this.working.set(false);
        this.sonner.error(mensajeCitaError(err, errMsg));
      },
    });
  }

  aceptar() {
    this.run(this.citaService.aceptar(this.id), 'Cita aceptada', 'No se pudo aceptar la cita');
  }
  rechazar() {
    this.run(this.citaService.rechazar(this.id), 'Oferta rechazada', 'No se pudo rechazar la oferta');
  }
  ofertar() {
    this.run(this.citaService.ofertar(this.id), 'Oferta reintentada', 'No se pudo reofertar la cita');
  }
  iniciar() {
    this.run(this.citaService.iniciar(this.id), 'Cita iniciada', 'No se pudo iniciar la cita');
  }
  completar() {
    this.run(this.citaService.completar(this.id), 'Cita completada', 'No se pudo completar la cita');
  }
  noShow() {
    this.run(this.citaService.noShow(this.id), 'Marcada como no-show', 'No se pudo marcar no-show');
  }

  /**
   * El backend no expone "qué empleados están calificados para este servicio" — sólo
   * "a qué servicios está calificado un empleado". La única señal que sí tenemos es
   * `cita.asignaciones`: la búsqueda de elegibles que el backend ya corrió al crear/reofertar
   * la cita. Ofrecer la lista completa de usuarios dejaba elegir a cualquiera y el backend
   * lo rechazaba con "no está calificado para este servicio" — restringir a esos candidatos
   * evita mandar una asignación condenada a fallar.
   */
  asignarManual() {
    const c = this.cita();
    if (!c) return;
    const idsCandidatos = new Set(c.asignaciones.map(a => a.empleado_id));
    if (idsCandidatos.size === 0) {
      this.sonner.error(
        'No hay empleados calificados para este servicio. Prueba "Reintentar oferta" o califica a alguien en Agenda → Catálogo → Empleados.',
      );
      return;
    }
    this.usuarioService.listar({ sort: 'nombre:asc', page_size: 100 }).subscribe({
      next: res => {
        this.sheetService.create({
          zTitle: 'Asignar manualmente',
          zDescription: 'Sólo aparecen los empleados calificados que se consideraron al ofertar esta cita.',
          zContent: AsignarManualSheetComponent,
          zData: { citaId: this.id, usuarios: res.data.filter(u => idsCandidatos.has(u.id)) },
          zOkText: 'Asignar',
          zCancelText: 'Cancelar',
          zOnOk: (i: any) => this.persistir(i, 'Cita asignada', 'No se pudo asignar la cita'),
        });
      },
      error: () => this.sonner.error('No se pudieron cargar los empleados'),
    });
  }

  cancelar() {
    this.sheetService.create({
      zTitle: 'Cancelar cita',
      zContent: CancelarCitaSheetComponent,
      zData: { citaId: this.id },
      zOkText: 'Cancelar cita',
      zCancelText: 'Volver',
      zOnOk: (i: any) => this.persistir(i, 'Cita cancelada', 'No se pudo cancelar la cita'),
    });
  }

  private persistir(instance: any, okMsg: string, errMsg: string): Promise<void> | false {
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: (c: CitaResponse) => {
          this.cita.set(c);
          this.sonner.success(okMsg);
          resolve();
        },
        error: (err: unknown) => {
          this.sonner.error(mensajeCitaError(err, errMsg));
          reject(err);
        },
      });
    });
  }

  facturar() {
    const c = this.cita();
    const s = this.servicio();
    if (!c || !s) return;
    this.cajaService.actual().subscribe({
      next: turno => {
        if (!turno) {
          this.sonner.error('Necesitas un turno de caja abierto. Abre caja en el Punto de venta.');
          return;
        }
        this.sheetService.create({
          zTitle: 'Cobrar cita',
          zDescription: s.nombre,
          zContent: FacturarCitaSheetComponent,
          zSize: 'lg',
          zData: { cita: c, total: Number(s.precio_venta) || 0, turnoId: turno.id },
          zOkText: 'Cobrar',
          zCancelText: 'Cancelar',
          zOnOk: (i: any) => {
            const obs = i.save();
            if (!obs) return false;
            return new Promise<void>((resolve, reject) => {
              obs.subscribe({
                next: (venta: { id: string }) => {
                  this.sonner.success('Cita cobrada');
                  this.cargar();
                  resolve();
                  this.router.navigate(['/ventas/historial', venta.id]);
                },
                error: (err: unknown) => {
                  this.sonner.error(mensajeCitaError(err, 'No se pudo cobrar la cita'));
                  reject(err);
                },
              });
            });
          },
        });
      },
      error: () => this.sonner.error('No se pudo verificar el turno de caja'),
    });
  }
}
